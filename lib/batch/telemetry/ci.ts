import { createHash } from 'node:crypto';

import { BatchTelemetryRunContext } from './types';

const MAX_RUN_ID_LENGTH = 255;

export function resolveBatchTelemetryRunContext(
  fallbackId: string,
  environment: NodeJS.ProcessEnv = process.env
): BatchTelemetryRunContext {
  const shardIndex = resolveNonNegativeInteger(environment.CI_NODE_INDEX);
  const shardCount = resolvePositiveInteger(environment.CI_NODE_TOTAL);

  if (environment.GITHUB_RUN_ID) {
    return {
      runId: normalizeRunId(
        `github:${environment.GITHUB_REPOSITORY ?? 'unknown'}:${
          environment.GITHUB_RUN_ID
        }:${environment.GITHUB_RUN_ATTEMPT ?? '1'}`
      ),
      ciProvider: 'github',
      shardIndex,
      shardCount,
    };
  }

  if (environment.CI_PIPELINE_ID) {
    return {
      runId: normalizeRunId(
        `gitlab:${
          environment.CI_PROJECT_ID ?? environment.CI_PROJECT_PATH ?? 'unknown'
        }:${environment.CI_PIPELINE_ID}`
      ),
      ciProvider: 'gitlab',
      shardIndex,
      shardCount,
    };
  }

  if (environment.BUILD_BUILDID) {
    return {
      runId: normalizeRunId(
        `azure:${
          environment.SYSTEM_TEAMPROJECTID ??
          environment.BUILD_REPOSITORY_ID ??
          'unknown'
        }:${environment.BUILD_BUILDID}`
      ),
      ciProvider: 'azure',
      shardIndex,
      shardCount,
    };
  }

  return {
    runId: `local:${fallbackId}`,
    ciProvider: 'local',
    shardIndex,
    shardCount,
  };
}

function normalizeRunId(value: string): string {
  if (value.length <= MAX_RUN_ID_LENGTH) {
    return value;
  }
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function resolveNonNegativeInteger(
  value: string | undefined
): number | undefined {
  const parsed = value === undefined ? undefined : Number(value);
  return Number.isSafeInteger(parsed) && parsed! >= 0 ? parsed : undefined;
}

function resolvePositiveInteger(value: string | undefined): number | undefined {
  const parsed = value === undefined ? undefined : Number(value);
  return Number.isSafeInteger(parsed) && parsed! > 0 ? parsed : undefined;
}
