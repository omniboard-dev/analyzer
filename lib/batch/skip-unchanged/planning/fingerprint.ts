import { createHash } from 'crypto';

import { Context } from '../../../interface';
import { RemoteHead } from '../../../services/git.service';

const ANALYSIS_FINGERPRINT_SCHEMA_VERSION = 1;
const { version: analyzerVersion } = require('../../../../package.json') as {
  version: string;
};

export interface AnalysisCacheEntry {
  sourceKey: string;
  sourceIdentity: string;
  sourceRef?: string;
  headSha: string;
  configDigest: string;
  optionsDigest: string;
  fingerprint: string;
  analyzerVersion: string;
}

export interface BatchAnalysisPlan {
  entry: AnalysisCacheEntry;
  unchanged: boolean;
}

export function createAnalysisCacheEntry(
  source: string,
  remoteHead: RemoteHead,
  ctx: Context
): AnalysisCacheEntry {
  const sourceIdentity = normalizeRepositoryIdentity(source);
  const sourceKey = digest(sourceIdentity);
  const configDigest = digest({
    checks: ctx.definitions.checks ?? [],
    settings: ctx.settings,
  });
  const optionsDigest = digest({
    errorsAsWarnings: ctx.options.errorsAsWarnings,
    sanitizeRepoUrl: ctx.options.sanitizeRepoUrl,
  });

  return createEntry({
    sourceKey,
    sourceIdentity,
    sourceRef: remoteHead.ref,
    headSha: remoteHead.sha,
    configDigest,
    optionsDigest,
  });
}

export function withAnalysisCacheHead(
  entry: AnalysisCacheEntry,
  headSha: string
): AnalysisCacheEntry {
  return createEntry({ ...entry, headSha });
}

export function normalizeRepositoryIdentity(source: string): string {
  const value = source.trim();

  if (value.includes('://')) {
    try {
      const url = new URL(value);
      const port =
        url.port &&
        !(
          (url.protocol === 'https:' && url.port === '443') ||
          (url.protocol === 'http:' && url.port === '80') ||
          (url.protocol === 'ssh:' && url.port === '22')
        )
          ? `:${url.port}`
          : '';
      return normalizeHostAndPath(`${url.hostname}${port}`, url.pathname);
    } catch {
      return normalizeHostAndPath('', value);
    }
  }

  const scpMatch = /^(?:[^@/]+@)?(?<host>[^:/]+):(?<path>.+)$/.exec(value);
  return scpMatch?.groups
    ? normalizeHostAndPath(scpMatch.groups.host, scpMatch.groups.path)
    : normalizeHostAndPath('', value);
}

function createEntry({
  sourceKey,
  sourceIdentity,
  sourceRef,
  headSha,
  configDigest,
  optionsDigest,
}: Omit<AnalysisCacheEntry, 'fingerprint' | 'analyzerVersion'>) {
  return {
    sourceKey,
    sourceIdentity,
    sourceRef,
    headSha,
    configDigest,
    optionsDigest,
    analyzerVersion,
    fingerprint: digest({
      schemaVersion: ANALYSIS_FINGERPRINT_SCHEMA_VERSION,
      sourceKey,
      sourceRef,
      headSha,
      configDigest,
      optionsDigest,
      analyzerVersion,
    }),
  };
}

function normalizeHostAndPath(host: string, rawPath: string): string {
  const path = rawPath
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '');
  return [host.toLowerCase(), path].filter(Boolean).join('/');
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const current = canonicalize((value as Record<string, unknown>)[key]);
        if (current !== undefined) {
          result[key] = current;
        }
        return result;
      }, {});
  }
  return value;
}
