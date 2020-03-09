#!/usr/bin/env node

import * as yargs from 'yargs';

import * as analyzeCommand from './commands/analyze';
import * as exampleCommand from './commands/example';
import * as testConnectionCommand from './commands/test-connection';
import { apiKeyMiddleware } from './middlewares/api-key.middleware';

yargs
  .command(exampleCommand)
  .command(analyzeCommand)
  .command(testConnectionCommand)
  .middleware(apiKeyMiddleware)
  .demandCommand()
  .help()
  .epilogue(
    'for more information, find check out at https://omniboard.dev/docs'
  ).argv;
