import chalk from 'chalk';
import { ListrTask } from 'listr2';

import { Context } from '../interface';

export const handledCheckFailureInfoTask: ListrTask = {
  title: 'Handled check failure info',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: (ctx: Context, task) => {
    if (ctx.handledCheckFailures.length) {
      const count = ctx.handledCheckFailures.length;
      task.title = `${task.title} - ${count} handled check failure${
        count > 1 ? 's' : ''
      } occurred`;
      ctx.handledCheckFailures.forEach((error) => {
        task.title = `${task.title}\n${chalk.yellow.bold(
          `⚠️ ${error.message}`
        )}`;
      });
    }
  },
};
