import { describe, expect, it } from 'vitest';

import { Context } from '../../interface';

import {
  completeProjectPlanning,
  createBatchTelemetryData,
  finishProjectAnalysis,
  getBatchResultCounts,
  initializeBatchTelemetry,
  startProjectAnalysis,
  startProjectPlanning,
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
    batch: {
      queue: ['a', 'b', 'c'],
      analyzed: [],
      skipped: [],
      failed: [],
    },
    debug: { commandStartedAt: 1_000 },
  };
}

describe('batch telemetry state', () => {
  it('reports analyzed, skipped by reason, and failed project counts', () => {
    const ctx = context();
    initializeBatchTelemetry(ctx, 5);
    startProjectPlanning(ctx, 1_100);
    completeProjectPlanning(
      ctx,
      {
        checkedProjects: 2,
        unchangedProjects: 2,
        unresolvedHeadProjects: 0,
      },
      1_200
    );
    startProjectAnalysis(ctx, 'analyzed', 1_300);
    finishProjectAnalysis(
      ctx,
      'analyzed',
      'analyzed',
      { outcome: 'analyzed' },
      1_400
    );
    startProjectAnalysis(ctx, 'excluded', 1_500);
    finishProjectAnalysis(
      ctx,
      'excluded',
      'excluded',
      { outcome: 'skipped', reason: 'excluded' },
      1_600
    );
    startProjectAnalysis(ctx, 'failed', 1_700);
    finishProjectAnalysis(
      ctx,
      'failed',
      'failed',
      { outcome: 'failed' },
      1_800
    );

    expect(getBatchResultCounts(ctx)).toEqual({
      analyzed: 1,
      skipped: 3,
      skippedByReason: {
        unchanged: 2,
        excluded: 1,
        unresolved: 0,
      },
      failed: 1,
    });
  });

  it('summarizes planning and project analysis durations', () => {
    const ctx = context();
    initializeBatchTelemetry(ctx, 3);
    startProjectPlanning(ctx, 1_100);
    completeProjectPlanning(
      ctx,
      {
        checkedProjects: 2,
        unchangedProjects: 1,
        unresolvedHeadProjects: 1,
      },
      1_300
    );
    startProjectAnalysis(ctx, 'a', 1_400);
    finishProjectAnalysis(
      ctx,
      'a',
      'project-a',
      { outcome: 'analyzed' },
      2_000
    );

    expect(createBatchTelemetryData(ctx, 'success', 2_200)).toEqual(
      expect.objectContaining({
        batchName: 'shard-2.json',
        durationMs: 1_200,
        projectsQueued: 3,
        planningDurationMs: 200,
        projectsCheckedForChanges: 2,
        projectsWithUnresolvedHead: 1,
        projectsAnalyzed: 1,
        projectsSkipped: 1,
        projectsSkippedByReason: {
          unchanged: 1,
          excluded: 0,
          unresolved: 0,
        },
        projectsFailed: 0,
        slowestProjects: [
          {
            projectName: 'project-a',
            durationMs: 600,
            outcome: 'analyzed',
            skipReason: undefined,
          },
        ],
      })
    );
  });
});
