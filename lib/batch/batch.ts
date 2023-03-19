import { Argv } from 'yargs';

import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';

import { initWorkspaceTask } from './tasks/init-workspace.task';
import { initJobTask } from './tasks/init-job.task';
import { runJobsTask } from './tasks/run-jobs.task';
import { retrieveSettingsTask } from '../tasks/retrieve-settings.task';

const logger = createLogger('BATCH');

export const command = 'batch';

export const aliases = ['b'];

export const describe =
  'Check out and analyze multiple project repositories and upload results to Omniboard.dev';

export const builder = (yargs: Argv) =>
  yargs
    .option('job-path', {
      type: 'string',
      default: './omniboard-job.json',
      description: 'Location of Omniboard batch job file',
    })
    .option('workspace-path', {
      type: 'string',
      default: './omniboard-workspace',
      description: 'Location where the Omniboard batch workspace is stored',
    });

export const handler = async (argv: any) =>
  runner(
    [retrieveSettingsTask, initJobTask, initWorkspaceTask, runJobsTask],
    argv,
    logger
  );