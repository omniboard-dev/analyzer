#!/usr/bin/env node

import yargs, { Argv } from 'yargs';

import * as analyzeCommand from './commands/analyze';
import * as testConnectionCommand from './commands/test-connection';
import { apiMiddleware } from './middlewares/api.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';

(yargs as Argv)
  .scriptName('omniboard')
  .middleware(loggerMiddleware)
  .middleware(apiMiddleware)
  .demandCommand(1, 'Please provide at least one of the supported commands...')
  .command(analyzeCommand)
  .command(testConnectionCommand)
  .option('json', {
    type: 'boolean',
    default: false,
    description:
      'Store data in local json file instead of uploading it to Omniboard'
  })
  .option('json-path', {
    type: 'string',
    default: './dist/omniboard.json',
    description: 'Location of local json file'
  })

  .option('verbose', {
    type: 'boolean',
    default: false,
    description: 'Print verbose logs'
  })
  .epilogue(
    'for more information, find check out at https://omniboard.dev/docs'
  ).argv;
