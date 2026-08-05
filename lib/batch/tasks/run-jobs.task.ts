import { ListrTask } from 'listr2';

import { Context } from '../../interface';

import { createJobTasks } from '../skip-unchanged';

import { runJobTaskFactory } from './run-job.task';

export const runJobsTask: ListrTask = {
  title: 'Run jobs',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: async (ctx: Context, task) =>
    task.newListr(createJobTasks(ctx, ctx.batch.queue, runJobTaskFactory), {
      exitOnError: false,
      exitAfterRollback: false,
    }),
};
