import { describe, expect, it } from 'vitest';

import { resolveBatchTelemetryRunContext } from './ci';

describe('resolveBatchTelemetryRunContext', () => {
  it('correlates GitHub runs automatically', () => {
    expect(
      resolveBatchTelemetryRunContext('fallback', {
        GITHUB_RUN_ID: '123',
        GITHUB_REPOSITORY: 'omniboard/analyzer',
        GITHUB_RUN_ATTEMPT: '2',
      })
    ).toEqual({
      runId: 'github:omniboard/analyzer:123:2',
      ciProvider: 'github',
      shardIndex: undefined,
      shardCount: undefined,
    });
  });

  it('correlates GitLab shards automatically', () => {
    expect(
      resolveBatchTelemetryRunContext('fallback', {
        CI_PIPELINE_ID: '456',
        CI_PROJECT_ID: '12',
        CI_NODE_INDEX: '3',
        CI_NODE_TOTAL: '8',
      })
    ).toEqual({
      runId: 'gitlab:12:456',
      ciProvider: 'gitlab',
      shardIndex: 3,
      shardCount: 8,
    });
  });

  it('creates an isolated local run when CI metadata is absent', () => {
    expect(resolveBatchTelemetryRunContext('invocation-id', {})).toEqual({
      runId: 'local:invocation-id',
      ciProvider: 'local',
      shardIndex: undefined,
      shardCount: undefined,
    });
  });
});
