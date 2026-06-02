import * as process from 'process';
import {
  EnvHttpProxyAgent,
  fetch,
  type Dispatcher,
  type Response as UndiciResponse,
} from 'undici';

import { Settings } from '../interface';

import { createLogger } from './logger.service';

interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  debug?: boolean;
  dispatcher?: Dispatcher;
}

interface ApiErrorBody {
  error?: string;
  statusCode?: number;
  message?: string | string[];
}

let apiConfig: ApiConfig;
const logger = createLogger('API SERVICE');

function createProxyDispatcher(): Dispatcher | undefined {
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;

  if (!httpProxy && !httpsProxy) {
    return undefined;
  }

  return new EnvHttpProxyAgent({
    httpProxy,
    httpsProxy,
    noProxy: process.env.NO_PROXY || process.env.no_proxy,
  });
}

export function createApiService(argv: any) {
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
    dispatcher: createProxyDispatcher(),
  };
}

function createUrl(path: string): string {
  const baseUrl = apiConfig.baseUrl.endsWith('/')
    ? apiConfig.baseUrl
    : `${apiConfig.baseUrl}/`;

  return new URL(path, baseUrl).toString();
}

function createHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiConfig.apiKey) {
    headers['omniboard-api-key'] = apiConfig.apiKey;
  }

  return headers;
}

async function parseResponseBody(response: UndiciResponse): Promise<any> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isApiErrorBody(body: any): body is ApiErrorBody {
  return Boolean(body && typeof body === 'object' && 'message' in body);
}

function createApiError(response: UndiciResponse, body: any): Error {
  const error = new Error(
    `Request failed with status ${response.status} ${response.statusText}`
  );

  if (isApiErrorBody(body)) {
    error.name = `${body.error} ${body.statusCode}`;
    error.message = `${body.message}`;
  }

  return error;
}

function createFetchError(url: string, error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }

  const cause = (error as Error & { cause?: Error & { code?: string } }).cause;
  const causeMessage = [cause?.code, cause?.message].filter(Boolean).join(' ');
  const message = causeMessage
    ? `Request to ${url} failed: ${causeMessage}`
    : `Request to ${url} failed: ${error.message}`;
  const fetchError = new Error(message);
  fetchError.name = error.name;

  return fetchError;
}

async function request<T>(
  path: string,
  options: { method?: 'GET' | 'PUT'; json?: any } = {}
): Promise<T> {
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
    dispatcher: apiConfig.dispatcher,
  }).catch((error) => {
    throw createFetchError(url, error);
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw createApiError(response, responseBody);
  }

  return responseBody as T;
}

export function ping(): Promise<{ organization: string }> {
  return request('ping');
}

export function uploadProject(project: any) {
  return request('project/cli', { method: 'PUT', json: project });
}

export function getChecks(): Promise<any[]> {
  return request('check/cli');
}

export function getSettings(): Promise<Settings> {
  return request('settings/cli');
}
