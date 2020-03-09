import got, { Got } from 'got';

import { createLogger } from './logger.service';

let api: Got;
const logger = createLogger('API SERVICE');

export const createApiService = (apiKey: string) => {
  api = got.extend({
    prefixUrl: 'https://api.omniboard.dev',
    headers: {
      'ob-api-key': apiKey
    },
    hooks: {
      // beforeRequest: [options => logger.info(options)]
    }
  });
};

export const ping = (): { organization: string } =>
  api<{ organization: string }>('ping').json() as any;
