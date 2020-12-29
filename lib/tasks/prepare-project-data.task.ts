import { ListrTask } from 'listr2';

import { Context } from '../interface';

export const prepareProjectDataTask: ListrTask = {
  title: 'Prepare project data',
  task: (ctx: Context, task) => {
    ctx.processedResults = { ...ctx.results };
  }
};
