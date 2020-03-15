import { createLogger, setVerbose } from '../services/logger.service';

const logger = createLogger('LOGGER MIDDLEWARE');

export const loggerMiddleware = (argv: any) => {
  if (argv.verbose) {
    setVerbose();
    logger.debug('verbose output');
  }
};
