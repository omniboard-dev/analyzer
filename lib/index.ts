#!/usr/bin/env node

process.env.GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE = '';

if (process.env.http_proxy && !process.env.HTTP_PROXY) {
  process.env.HTTP_PROXY = process.env.http_proxy;
}
if (process.env.https_proxy && !process.env.HTTPS_PROXY) {
  process.env.HTTPS_PROXY = process.env.https_proxy;
}
if (process.env.no_proxy && !process.env.NO_PROXY) {
  process.env.NO_PROXY = process.env.no_proxy;
}

import 'global-agent/bootstrap';
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
  .option('verbose', {
    type: 'boolean',
    default: false,
    description: 'Display debug level logs'
  })
  .option('api-key', {
    alias: 'ak',
    describe: 'API key generated in the Omniboard.dev app'
  })
  .option('errors-as-warnings', {
    type: 'boolean',
    default: false,
    description:
      'Exit with success (0) even in case of errors and log them as warnings'
  })
  .alias('v', 'version')
  .alias('h', 'help')
  .epilogue(
    'for more information, find check out at https://omniboard.dev/docs.html'
  ).argv;
