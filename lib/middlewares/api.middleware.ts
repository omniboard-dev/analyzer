import { createLogger } from '../services/logger.service';
import { createApiService } from '../services/api.service';

const logger = createLogger('API MIDDLEWARE');

export const apiMiddleware = (argv: any) => {
  if (argv.json) {
    logger.debug('store results in local json file (no upload)');
    return;
  }
  const apiKey = argv.apiKey || process.env.OMNIBOARD_API_KEY;
  if (!apiKey) {
    logger.error(`API key is required, please provide it using one of the options:
  1. OMNIBOARD_API_KEY env variable 
  2. --api-key param
  3. or use --json flag to store results locally (no upload)`);
    process.exit(1);
  }
  logger.debug(
    `upload results to Omniboard ${argv.dev ? '(DEV localhost:8080)' : ''}`
  );
  createApiService(apiKey, argv.dev);
};
