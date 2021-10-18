import { ListrTask } from 'listr2';

import { Context } from '../interface';

export const printProjectCliOutputTask: ListrTask = {
  title: 'Print project results (CLI output)',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: (ctx: Context, task) => {
    JSON.stringify(ctx.processedResults ?? {}, null, 2)
      .split(/(\r)?\n/)
      .filter(Boolean)
      .forEach((line) => {
        // preserve white-space using non-printable utf character
        task.output = `\u200b ${line}`;
      });
  },
  options: {
    bottomBar: Infinity,
    persistentOutput: true,
  },
};
