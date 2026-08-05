import { describe, expect, it } from 'vitest';

import { Context } from '../../interface';

import {
  completeCachePlanning,
  createBatchTelemetryData,
  finishBatchJob,
  initializeBatchTelemetry,
  startBatchJob,
  startCachePlanning,
} from './state';

function context(): Context {
  return {
    options: {
      jobPath: '/tmp/jobs/shard-2.json',
    } as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: { checks: {} },
    handledCheckFailures: [],
    batch: { queue: ['a', 'b', 'c'], completed: [], failed: [] },
    debug: { commandStartedAt: 1_000 },
  };
}

describe('batch telemetry state', () => {
  it('summarizes cache planning and full job durations', () => {
    const ctx = context();
    initializeBatchTelemetry(ctx, 3);
    startCachePlanning(ctx, 1_100);
    completeCachePlanning(
      ctx,
      {
        checkedProjects: 2,
        cacheHitProjects: 1,
        unresolvedHeadProjects: 1,
      },
      1_300
    );
    startBatchJob(ctx, 'a', 1_400);
    finishBatchJob(ctx, 'a', 'project-a', 'succeeded', 2_000);

    expect(createBatchTelemetryData(ctx, 'success', 2_200)).toEqual(
      expect.objectContaining({
        batchName: 'shard-2.json',
        durationMs: 1_200,
        projectsQueued: 3,
        cachePlanningDurationMs: 200,
        cacheCheckedProjects: 2,
        cacheHitProjects: 1,
        unresolvedHeadProjects: 1,
        jobsStarted: 1,
        jobsSucceeded: 1,
        slowestProjects: [
          {
            projectName: 'project-a',
            durationMs: 600,
            status: 'succeeded',
          },
        ],
      })
    );
  });
});
