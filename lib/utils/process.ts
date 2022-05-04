import { Listr, ListrTask } from 'listr2';

import { Context, Options } from '../interface';
import { Logger } from '../services/logger.service';

import { formatTime } from './time';

export const runner = async (
  tasks: ListrTask[],
  options: Options,
  logger: Logger
) => {
  const start = new Date().getTime();
  logger.info('Start');
  const context: Context = {
    options,
    control: { skipEverySubsequentTask: false },
    settings: {},
    results: { checks: {} },
    definitions: {},
    handledCheckFailures: [],
  };
  await new Listr(tasks, {
    rendererFallback: () => options?.verbose,
    rendererOptions: { collapse: false, showTimer: true },
    renderer: options.silent ? 'silent' : 'default',
  })
    .run(context)
    .then(() => {
      if (context.handledCheckFailures.length) {
        logger.warning(
          `${context.handledCheckFailures.length} handled check failure${
            context.handledCheckFailures.length > 1 ? 's' : ''
          } occurred`
        );
        context.handledCheckFailures.forEach((error) => {
          logger.warning(error.message);
        });
      }
      const duration = new Date().getTime() - start;
      logger.info(`Finished (${formatTime(duration)})`);
      process.exit(0);
    })
    .catch((err) => {
      const duration = new Date().getTime() - start;

      if (options.errorsAsWarnings) {
        logger.warning(`Finished (${formatTime(duration)}) with error`);
        logger.warning(err);
        if (err?.response?.body?.message) {
          logger.warning(err.response.body.message);
        }
        process.exit(0);
      } else {
        logger.error(`Finished (${formatTime(duration)}) with error`);
        logger.error(err);
        if (err?.response?.body?.message) {
          logger.error(err.response.body.message);
        }
        process.exit(1);
      }
    });
};
