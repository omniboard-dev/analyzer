import { ListrTask } from 'listr2';

import { Context } from '../interface';

export const printProjectCliOutputTask: ListrTask = {
  title: 'Print project results (CLI output)',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: (ctx: Context) => {
    console.log(JSON.stringify(ctx.results ?? {}, null, 2));
  },
  options: {
    bottomBar: Infinity,
    persistentOutput: true,
  },
};
