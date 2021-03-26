import { ListrTask } from 'listr2';

import { Context } from '../interface';

export const prepareProjectDataTask: ListrTask = {
  title: 'Prepare project data',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: (ctx: Context, task) => {
    ctx.processedResults = { ...ctx.results };
  }
};
