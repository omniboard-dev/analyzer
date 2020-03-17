import { ListrTask } from 'listr';

import { Context } from '../interface';

export const prepareProjectDataTask: ListrTask = {
  title: 'Prepare project data',
  task: (ctx: Context, task) => {
    ctx.processedResults = { ...ctx.results };
  }
};
