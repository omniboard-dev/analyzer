import { ListrErrorTypes, ListrTask, type Listr } from 'listr2';

import { Context } from '../../interface';
import { writeJson } from '../../services/fs.service';
import { getRepoNameFromUrl } from '../../services/git.service';
import { reportFailedAnalysis } from '../../services/analyzer-telemetry.service';
import { finishBatchJob, startBatchJob } from '../telemetry/state';

import {
  getAnalysisDurationMs,
  recordAnalysisDurationTask,
  startAnalysisDurationTask,
} from '../../tasks/analysis-duration.task';
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
  let jobTasks: Listr<Context, any, any> | undefined;

  return {
    title: `${index} / ${total} - ${getRepoNameFromUrl(job)}`,
    rollback: async (ctx: Context, task) => {
      const repositoryName = getRepoNameFromUrl(job);
      const durationMs = getAnalysisDurationMs(ctx);
      finishBatchJob(ctx, job, ctx.results.name ?? repositoryName, 'failed');
      ctx.debug.analysisFailures = [
        ...(ctx.debug.analysisFailures ?? []),
        {
          source: job,
          repositoryName,
          projectName: ctx.results.name ?? repositoryName,
          durationMs,
        },
      ];
      const jobError = jobTasks?.errors.find(
        ({ type }) => type === ListrErrorTypes.HAS_FAILED
      )?.error;
      await reportFailedAnalysis(
        ctx,
        jobError ??
          ctx.debug.analyzerTelemetryError ??
          new Error('Batch analysis failed'),
        ctx.results.name ?? repositoryName
      );

      // update batch state
      task.title = `${task.title} failed (${durationMs}ms)`;
      ctx.batch.failed.push(job);
      ctx.batch.queue = ctx.batch.queue.filter((j) => j !== job);

      if (!ctx.options.preserveQueue) {
        writeJson(ctx.options.jobPath, ctx.batch);
        task.title = `${task.title} failed, added to failed jobs`;
      }
    },
    task: async (ctx: Context, task) => {
      startBatchJob(ctx, job);
      jobTasks = task.newListr(
        [
          initJobStateTask,
          initJobRepo(job),
          startAnalysisDurationTask,
          projectInfoTask,
          runChecksTask,
          recordAnalysisDurationTask,
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
      return jobTasks;
    },
  };
}
