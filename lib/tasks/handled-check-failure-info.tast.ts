import chalk from 'chalk';
import { ListrTask } from 'listr2';

import { Context } from '../interface';
import { createLogger } from '../services/logger.service';
import { formatTime } from '../utils/time';

const logger = createLogger('WARNINGS');

export const handledCheckFailureInfoTask: ListrTask = {
  title: 'Print handled warning info',
  skip: (ctx: Context) => !ctx.handledCheckFailures.length,
  task: (ctx: Context, task) => {
    const count = ctx.handledCheckFailures.length;
    const summary = `${count} handled warning${count > 1 ? 's' : ''} occurred`;
    task.title = `${task.title} - ${summary}`;

    if (ctx.options.silent) {
      const projectName = ctx.results.name;
      const analysisDurationMs = ctx.results.analysisDurationMs;
      const projectPrefix = projectName
        ? `[${projectName}]${
            analysisDurationMs === undefined
              ? ''
              : ` (${formatTime(analysisDurationMs)})`
          } `
        : '';
      logger.warning(`${projectPrefix}${summary}`);
      ctx.handledCheckFailures.forEach((error) =>
        logger.warning(error.message)
      );
      console.log();
    } else {
      ctx.handledCheckFailures.forEach((error) => {
        task.title = `${task.title}\n${chalk.yellow.bold(
          `\n ⚠️ ${error.message}`
        )}`;
      });
    }
  },
};
