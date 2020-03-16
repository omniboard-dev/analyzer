import { Argv } from 'yargs';

import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';
import { projectInfoTask } from '../tasks/project-info.task';
import { retrieveChecksTask } from '../tasks/retrieve-checks.task';
import { saveProjectApiTask } from '../tasks/save-project-api.task';
import { saveProjectJsonTask } from '../tasks/save-project-json.task';
import { prepareProjectDataTask } from '../tasks/prepare-project-data.task';

const logger = createLogger('ANALYZE');

export const command = 'analyze';

export const aliases = ['$0', 'a'];

export const describe =
  'Analyze project and update it on Omniboard (or generate local json)';

export const builder = (yargs: Argv) =>
  yargs
    .option('json', {
      type: 'boolean',
      default: false,
      description: 'Store data in local json file'
    })
    .option('json-path', {
      type: 'string',
      default: './dist/omniboard.json',
      description: 'Location of local json file'
    });

export const handler = async (argv: any) =>
  runner(
    [
      projectInfoTask,
      retrieveChecksTask,
      prepareProjectDataTask,
      saveProjectJsonTask,
      saveProjectApiTask
    ],
    argv,
    logger
  );
