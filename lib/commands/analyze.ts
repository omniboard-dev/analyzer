import { Argv } from 'yargs';
import Listr from 'listr';

import { formatTime } from '../utils/time';
import { createLogger } from '../services/logger.service';
import { projectInfoTask } from '../tasks/project-info.task';
import { saveProjectApiTask } from '../tasks/save-project-api.task';
import { saveProjectJsonTask } from '../tasks/save-project-json.task';
import { prepareProjectDataTask } from '../tasks/prepare-project-data.task';

const logger = createLogger('ANALYZE');

export const command = 'analyze';

export const aliases = ['$0', 'a'];

export const describe = 'Analyze project';

export const builder = (yargs: Argv) => yargs;

export const handler = async (argv: any) => {
  const start = new Date().getTime();
  logger.info('Start');
  const tasks = [
    projectInfoTask,
    prepareProjectDataTask,
    saveProjectJsonTask,
    saveProjectApiTask
  ];
  await new Listr(tasks)
    .run(argv)
    .then(res => {
      const duration = new Date().getTime() - start;
      logger.info(`Finished: ${formatTime(duration)}`);
    })
    .catch(err => logger.error(err));
};
