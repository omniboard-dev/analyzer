import { ListrTask } from 'listr2';

import { Context } from '../../interface';
import { writeJson } from '../../services/fs.service';
import { getRepoNameFromUrl } from '../../services/git.service';

import { projectInfoTask } from '../../tasks/project-info.task';
import { handledCheckFailureInfoTask } from '../../tasks/handled-check-failure-info.tast';
import { saveProjectApiTask } from '../../tasks/save-project-api.task';
import { runChecksTask } from '../../tasks/run-checks.task';

import { initJobRepo } from './init-job-repo.task';
import { initJobStateTask } from './init-job-state.task';
import { finalizeJobTaskFactory } from './finalize-job.task';
import { batchSaveProjectJsonTaskFactory } from './batch-save-project-json.task';

export function runJobTaskFactory(
  job: string,
  index: number,
  total: number
): ListrTask {
  return {
    title: `${index} / ${total} - ${getRepoNameFromUrl(job)}`,
    rollback: async (ctx: Context, task) => {
      // update batch state
      task.title = `${task.title} failed`;
      ctx.batch.failed.push(job);
      ctx.batch.queue = ctx.batch.queue.filter((j) => j !== job);

      if (!ctx.options.preserveQueue) {
        writeJson(ctx.options.jobPath, ctx.batch);
        task.title = `${task.title} failed, added to failed jobs`;
      }
    },
    task: async (ctx: Context, task) => {
      return task.newListr(
        [
          initJobStateTask,
          initJobRepo(job),
          projectInfoTask,
          runChecksTask,
          batchSaveProjectJsonTaskFactory(job),
          saveProjectApiTask,
          handledCheckFailureInfoTask,
          finalizeJobTaskFactory(job, task),
        ],
        {
          collectErrors: 'minimal',
          exitOnError: true,
          rendererOptions: {
            collapseSubtasks: true,
          },
        }
      );
    },
  };
}
