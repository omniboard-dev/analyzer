import { ListrTask } from 'listr2';

import { Context } from '../../interface';

import { runJobTaskFactory } from './run-job.task';

export const runJobsTask: ListrTask = {
  title: 'Run jobs',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: async (ctx: Context, task) =>
    task.newListr(
      ctx.batch.queue.map((queuedJob, index) =>
        runJobTaskFactory(queuedJob, index + 1, ctx.batch.queue.length)
      ),
      {
        exitOnError: false,
        exitAfterRollback: false,
      }
    ),
};
