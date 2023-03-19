import { ListrTask } from 'listr2';

import { Context } from '../../interface';

import { initJobRepo } from './init-job-repo.task';

export function runJobTaskFactory(job: string): ListrTask {
  return {
    title: `${job}`,
    task: async (ctx: Context, task) => {
      return task.newListr([initJobRepo(job)]);
    },
  };
}
