import { createLogger } from '../services/logger.service';
import { createApiService } from '../services/api.service';

const logger = createLogger('API KEY MIDDLEWARE');

export const apiKeyMiddleware = (argv: any) => {
  const apiKey = argv.apiKey || process.env.OB_API_KEY;
  if (!apiKey) {
    logger.error(`API key is required, please provide it using one of the options:
  1. OB_API_KEY env variable 
  2. --api-key param`);
    process.exit(1);
  }
  createApiService(apiKey);
};
