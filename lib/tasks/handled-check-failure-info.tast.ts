import chalk from 'chalk';
import { ListrTask } from 'listr2';

import { Context } from '../interface';
import { createLogger } from '../services/logger.service';

const logger = createLogger('WARNINGS');

export const handledCheckFailureInfoTask: ListrTask = {
  title: 'Print handled warning info',
  skip: (ctx: Context) => !ctx.handledCheckFailures.length,
  task: (ctx: Context, task) => {
    const count = ctx.handledCheckFailures.length;
    const summary = `${count} handled warning${count > 1 ? 's' : ''} occurred`;
    task.title = `${task.title} - ${summary}`;

    if (ctx.options.silent) {
      logger.warning(summary);
      ctx.handledCheckFailures.forEach((error) =>
        logger.warning(error.message)
      );
    } else {
      ctx.handledCheckFailures.forEach((error) => {
        task.title = `${task.title}\n${chalk.yellow.bold(
          `\n ⚠️ ${error.message}`
        )}`;
      });
    }
  },
};
