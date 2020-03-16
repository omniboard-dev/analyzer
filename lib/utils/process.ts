import Listr, { ListrTask } from 'listr';

import { Options } from '../options.interface';
import { Logger } from '../services/logger.service';

import { formatTime } from './time';

export const runner = async (tasks: ListrTask[], options: Options, logger: Logger) => {
  const start = new Date().getTime();
  logger.info('Start');
  await new Listr(tasks)
    .run({ options })
    .then(res => {
      const duration = new Date().getTime() - start;
      logger.info(`Finished (${formatTime(duration)})`);
    })
    .catch(err => {
      const duration = new Date().getTime() - start;
      logger.error(`Finished (${formatTime(duration)}) with error`);
      logger.error(err);
      process.exit(1);
    });
};
