import { Argv } from 'yargs';

import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';
import { runChecksTask } from '../tasks/run-checks.task';
import { projectInfoTask } from '../tasks/project-info.task';
import { saveProjectJsonTask } from '../tasks/save-project-json.task';
import { prepareProjectDataTask } from '../tasks/prepare-project-data.task';
import { printProjectCliOutputTask } from '../tasks/print-project-cli-output.task';
import { handledCheckFailureInfoTask } from '../tasks/handled-check-failure-info.tast';

const logger = createLogger('TEST CHECK');

export const command = 'test-check';

export const aliases = ['tch'];

export const describe = 'Test check definition provided as a CLI argument';

export const builder = (yargs: Argv) =>
  yargs
    .option('check-definition', {
      alias: 'cd',
      type: 'string',
      description:
        'Check definition as a JSON (click the "< >" (code) icon on a check item in Omniboard.dev)',
    })
    .option('json', {
      type: 'boolean',
      default: false,
      description: 'Store data in local json file',
    })
    .option('json-path', {
      type: 'string',
      default: './dist/omniboard.json',
      description: 'Location of local json file',
    });

export const handler = async (argv: any) =>
  runner(
    [
      projectInfoTask,
      runChecksTask,
      prepareProjectDataTask,
      saveProjectJsonTask,
      printProjectCliOutputTask,
      handledCheckFailureInfoTask,
    ],
    argv,
    logger
  );
