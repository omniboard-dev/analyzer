import { ListrTask } from 'listr2';

import { Context } from '../../interface';

import { runJobTaskFactory } from './run-job.task';

export const runJobsTask: ListrTask = {
  title: 'Run jobs',
  task: async (ctx: Context, task) =>
    task.newListr(
      ctx.batchJob.queue.map((queuedJob) => runJobTaskFactory(queuedJob))
    ),
};
