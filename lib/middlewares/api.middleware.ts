import { createLogger } from '../services/logger.service';
import { createApiService } from '../services/api.service';

const logger = createLogger('API MIDDLEWARE');

export const apiMiddleware = (argv: any) => createApiService(argv);
