import { ListrTask } from 'listr2';

import { writeJson } from '../../services/fs.service';
import { Context, ParentTask } from '../../interface';
import { getRepoNameFromUrl } from '../../services/git.service';
import { finishProjectAnalysis } from '../telemetry/state';

export function finalizeJobTaskFactory(
  job: string,
  parentTask: ParentTask
): ListrTask {
  return {
    title: 'Finalize job',
    task: async (ctx: Context, task) => {
      const skipReason = ctx.control.projectSkipReason;
      const result = skipReason
        ? { outcome: 'skipped' as const, reason: skipReason }
        : { outcome: 'analyzed' as const };
      finishProjectAnalysis(
        ctx,
        job,
        ctx.results.name ?? getRepoNameFromUrl(job),
        result
      );

      // reset job CTX state
      ctx.control = { skipEverySubsequentTask: false };
      ctx.results = { checks: {} };
      ctx.handledCheckFailures = [];

      // reset cwd
      process.chdir('../../');

      // update batch state
      if (result.outcome === 'skipped') {
        ctx.batch.skipped.push({ source: job, reason: result.reason });
      } else {
        ctx.batch.analyzed.push(job);
      }
      ctx.batch.queue = ctx.batch.queue.filter((j) => j !== job);

      if (!ctx.options.preserveQueue) {
        writeJson(ctx.options.jobPath, ctx.batch);
      }

      task.title = `${task.title} successful`;
      parentTask.title =
        result.outcome === 'skipped'
          ? `${parentTask.title} skipped (${result.reason})`
          : `${parentTask.title} analyzed`;
    },
  };
}
