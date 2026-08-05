import { Argv } from 'yargs';

import {
  recordAnalysisDurationTask,
  startAnalysisDurationTask,
} from '../tasks/analysis-duration.task';
import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';
import { projectInfoTask } from '../tasks/project-info.task';
import { retrieveChecksTask } from '../tasks/retrieve-checks.task';
import { saveProjectApiTask } from '../tasks/save-project-api.task';
import { saveProjectJsonTask } from '../tasks/save-project-json.task';
import { retrieveSettingsTask } from '../tasks/retrieve-settings.task';
import { handledCheckFailureInfoTask } from '../tasks/handled-check-failure-info.tast';
import { runChecksTask } from '../tasks/run-checks.task';
import { testConnectionTask } from '../tasks/test-connection.task';

const logger = createLogger('ANALYZE');

export const command = 'analyze';

export const aliases = ['$0', 'a'];

export const describe =
  'Analyze project and upload results to Omniboard.dev, or store results locally with --json';

export const builder = (yargs: Argv) =>
  yargs
    .option('json', {
      type: 'boolean',
      default: false,
      description: 'Store results locally and skip upload',
    })
    .option('json-path', {
      type: 'string',
      default: './dist/omniboard.json',
      description: 'Local results path',
    })
    .option('check-pattern', {
      alias: 'cp',
      type: 'string',
      description: 'Run only checks matching the pattern',
    })
    .option('telemetry', {
      type: 'boolean',
      default: false,
      description: 'Report analyzer performance telemetry to Omniboard.dev',
    })
    .option('sanitize-repo-url', {
      alias: 'sru',
      type: 'boolean',
      default: true,
      description: 'Sanitize authentication tokens in repository URLs',
    });

export const handler = async (argv: any) =>
  runner(
    [
      testConnectionTask,
      retrieveSettingsTask,
      startAnalysisDurationTask,
      projectInfoTask,
      retrieveChecksTask,
      runChecksTask,
      recordAnalysisDurationTask,
      saveProjectJsonTask,
      saveProjectApiTask,
      handledCheckFailureInfoTask,
    ],
    argv,
    logger
  );
