import { ListrTask } from 'listr2';

import { Context } from '../../interface';

import { runJobTaskFactory } from './run-job.task';

export const runJobsTask: ListrTask = {
  title: 'Run jobs',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: async (ctx: Context, task) =>
    task.newListr(
      ctx.batch.queue.map((queuedJob) => runJobTaskFactory(queuedJob)),
      {
        exitOnError: false,
        exitAfterRollback: false,
      }
    ),
};
