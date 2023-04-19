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
    settings: {},
    definitions: {},
    control: { skipEverySubsequentTask: false },
    results: { checks: {} },
    handledCheckFailures: [],
    batch: { queue: [], completed: [], failed: [] },
    debug: {},
  };
  await new Listr(tasks, {
    fallbackRenderer: 'verbose',
    rendererOptions: {
      collapse: false,
      showTimer: true,
      formatOutput: 'wrap',
    },
    renderer: options.silent
      ? 'silent'
      : options.verbose
      ? 'verbose'
      : 'default',
  })
    .run(context)
    .then(() => {
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
