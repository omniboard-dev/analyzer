import got, { Got } from 'got';

import { createLogger } from './logger.service';

let api: Got;
const logger = createLogger('API SERVICE');

export const createApiService = (argv: any) => {
  const { dev, apiKey, apiUrl, debug } = argv;
  const key = apiKey || process.env.OMNIBOARD_API_KEY;
  if (!key) {
    logger.debug(`No API key provided, API related tasks will be skipped`);
  } else {
    logger.debug(
      `Upload results to to Omniboard ${argv.dev ? '(DEV localhost:8080)' : ''}`
    );
  }

  api = got.extend({
    retry: 0,
    responseType: 'json',
    resolveBodyOnly: true,
    prefixUrl: dev
      ? 'http://localhost:8080'
      : apiUrl ?? 'https://api.omniboard.dev',
    headers: {
      'omniboard-api-key': key,
    },
    hooks: {
      beforeRequest: debug ? [(options) => logger.info(options)] : [],
    },
  });
};

export const ping = (): { organization: string } =>
  api<{ organization: string }>('ping') as any;

export const uploadProject = (project: any) =>
  api.put('project/cli', { json: project });

export const getChecks = (): Promise<any[]> => api('check/cli') as any;

export const getSettings = (): Promise<any> => api('settings/cli') as any;
