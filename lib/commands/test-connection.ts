import { Argv } from 'yargs';

import { runner } from '../utils/process';
import { createLogger } from '../services/logger.service';
import { testConnectionTask } from '../tasks/test-connection.task';

const logger = createLogger('TEST CONNECTION');

export const command = 'test-connection';

export const aliases = ['tc'];

export const describe = 'Test connection to Omniboard with provided API key';

export const builder = (yargs: Argv) =>
  yargs.example('omniboard tc --api-key MY_API_KEY', '');

export const handler = async (argv: any) =>
  runner([testConnectionTask], argv, logger);
