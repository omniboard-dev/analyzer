import { Argv } from 'yargs';

import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';

import { initWorkspaceTask } from './tasks/init-workspace.task';
import { initJobTask } from './tasks/init-job.task';
import { runJobsTask } from './tasks/run-jobs.task';
import { retrieveSettingsTask } from '../tasks/retrieve-settings.task';
import { retrieveChecksTask } from '../tasks/retrieve-checks.task';

import * as skipUnchanged from './skip-unchanged';
import { reportBatchTelemetry } from './telemetry/reporter';

const logger = createLogger('BATCH');

export const command = 'batch';

export const aliases = ['b'];

export const describe =
  'Clone (or update) and analyze multiple project repositories and upload results to Omniboard.dev, or store results locally with --json';

export const builder = (yargs: Argv) =>
  skipUnchanged
    .addSkipUnchangedOption(yargs)
    .option('job-path', {
      type: 'string',
      default: './omniboard-job.json',
      description: 'Batch job file',
    })
    .option('preserve-queue', {
      type: 'boolean',
      default: false,
      description: 'Preserve the queue for repeated runs',
    })
    .option('workspace-path', {
      type: 'string',
      default: './omniboard-workspace',
      description: 'Batch workspace',
    })
    .option('json', {
      type: 'boolean',
      default: false,
      description: 'Store results locally and skip upload',
    })
    .option('check-pattern', {
      alias: 'cp',
      type: 'string',
      description: 'Run only checks matching the pattern',
    })
    .option('sanitize-repo-url', {
      alias: 'sru',
      type: 'boolean',
      default: true,
      description: 'Sanitize authentication tokens in repository URLs',
    })
    .option('telemetry', {
      type: 'boolean',
      default: true,
      description: 'Report analyzer performance telemetry to Omniboard.dev',
    });

export const handler = async (argv: any) =>
  runner(
    [
      initWorkspaceTask,
      initJobTask,
      retrieveSettingsTask,
      retrieveChecksTask,
      skipUnchanged.planUnchangedJobsTask,
      runJobsTask,
    ],
    argv,
    logger,
    { onFinished: reportBatchTelemetry }
  );
