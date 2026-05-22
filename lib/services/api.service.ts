import { createLogger } from './logger.service';
import { Settings } from '../interface';
import * as process from 'process';

interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  debug?: boolean;
}

interface ApiErrorBody {
  error?: string;
  statusCode?: number;
  message?: string | string[];
}

let apiConfig: ApiConfig;
const logger = createLogger('API SERVICE');

export const createApiService = (argv: any) => {
  const { dev, apiKey, apiUrl, debug, json } = argv;
  const key = apiKey || process.env.OMNIBOARD_API_KEY;
  if (!key) {
    logger.debug(`No API key provided, API related tasks will be skipped`);
  } else if (json) {
    logger.debug(`Use Omniboard API for settings and checks only`);
  } else {
    logger.debug(
      `Upload results to to Omniboard ${dev ? '(DEV localhost:8080)' : ''}`
    );
  }

  apiConfig = {
    baseUrl: dev
      ? 'http://localhost:8080'
      : apiUrl ?? 'https://api.omniboard.dev',
    apiKey: key,
    debug,
  };
};

const createUrl = (path: string): string => {
  const baseUrl = apiConfig.baseUrl.endsWith('/')
    ? apiConfig.baseUrl
    : `${apiConfig.baseUrl}/`;

  return new URL(path, baseUrl).toString();
};

const createHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiConfig.apiKey) {
    headers['omniboard-api-key'] = apiConfig.apiKey;
  }

  return headers;
};

const parseResponseBody = async (response: Response): Promise<any> => {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const isApiErrorBody = (body: any): body is ApiErrorBody =>
  Boolean(body && typeof body === 'object' && 'message' in body);

const createApiError = (response: Response, body: any): Error => {
  const error = new Error(
    `Request failed with status ${response.status} ${response.statusText}`
  );

  if (isApiErrorBody(body)) {
    error.name = `${body.error} ${body.statusCode}`;
    error.message = `${body.message}`;
  }

  return error;
};

const request = async <T>(
  path: string,
  options: { method?: 'GET' | 'PUT'; json?: any } = {}
): Promise<T> => {
  const method = options.method ?? 'GET';
  const url = createUrl(path);
  const headers = createHeaders();
  const body =
    options.json === undefined ? undefined : JSON.stringify(options.json);

  if (apiConfig.debug) {
    logger.info({
      method,
      url,
      headers: {
        ...headers,
        'omniboard-api-key': headers['omniboard-api-key'] ? '[set]' : undefined,
      },
      body,
    });
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw createApiError(response, responseBody);
  }

  return responseBody as T;
};

export const ping = (): Promise<{ organization: string }> =>
  request('ping');

export const uploadProject = (project: any) =>
  request('project/cli', { method: 'PUT', json: project });

export const getChecks = (): Promise<any[]> => request('check/cli');

export const getSettings = (): Promise<Settings> =>
  request('settings/cli');
