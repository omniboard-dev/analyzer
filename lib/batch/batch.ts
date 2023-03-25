import { Argv } from 'yargs';

import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';

import { initWorkspaceTask } from './tasks/init-workspace.task';
import { initJobTask } from './tasks/init-job.task';
import { runJobsTask } from './tasks/run-jobs.task';
import { retrieveSettingsTask } from '../tasks/retrieve-settings.task';
import { retrieveChecksTask } from '../tasks/retrieve-checks.task';

const logger = createLogger('BATCH');

export const command = 'batch';

export const aliases = ['b'];

export const describe =
  'Clone (or update) and analyze multiple project repositories and upload results to Omniboard.dev';

export const builder = (yargs: Argv) =>
  yargs

    .option('job-path', {
      type: 'string',
      default: './omniboard-job.json',
      description: 'Location of Omniboard batch job file',
    })
    .option('preserve-queue', {
      type: 'boolean',
      default: false,
      description:
        'Preserves Omniboard batch job queue (good for multiple runs)',
    })
    .option('workspace-path', {
      type: 'string',
      default: './omniboard-workspace',
      description: 'Location where the Omniboard batch workspace is stored',
    })
    .option('json', {
      type: 'boolean',
      default: false,
      description: 'Store results data in local json file',
    })
    .option('check-pattern', {
      alias: 'cp',
      type: 'string',
      description: 'Only run checks matching provided pattern',
    });

export const handler = async (argv: any) =>
  runner(
    [
      initWorkspaceTask,
      initJobTask,
      retrieveSettingsTask,
      retrieveChecksTask,
      runJobsTask,
    ],
    argv,
    logger
  );
