import Listr, { ListrTask } from 'listr';

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
    results: { checks: {} },
    definitions: {}
  };
  await new Listr(tasks, { collapse: false } as any)
    .run(context)
    .then(res => {
      const duration = new Date().getTime() - start;
      logger.info(`Finished (${formatTime(duration)})`);
    })
    .catch(err => {
      const duration = new Date().getTime() - start;
      logger.error(`Finished (${formatTime(duration)}) with error`);
      logger.error(err);
      if (err?.response?.body?.message) {
        logger.error(err.response.body.message);
      }
      process.exit(1);
    });
};
