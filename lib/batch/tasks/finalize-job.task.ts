import { ListrTask } from 'listr2';

import { writeJson } from '../../services/fs.service';
import { Context, ParentTask } from '../../interface';

export function finalizeJobTaskFactory(
  job: string,
  parentTask: ParentTask
): ListrTask {
  return {
    title: 'Finalize job',
    task: async (ctx: Context, task) => {
      // reset job CTX state
      ctx.control = { skipEverySubsequentTask: false };
      ctx.results = { checks: {} };
      ctx.handledCheckFailures = [];

      // reset cwd
      process.chdir('../../');

      // update batch state
      if (!ctx.options.preserveQueue) {
        ctx.batch.completed.push(job);
        ctx.batch.queue = ctx.batch.queue.filter((j) => j !== job);
        writeJson(ctx.options.jobPath, ctx.batch);
      }

      task.title = `${task.title} successful`;
      parentTask.title = `${parentTask.title} successful`;
    },
  };
}
