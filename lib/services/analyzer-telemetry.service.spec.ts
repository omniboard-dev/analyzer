import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../interface';
import * as api from './api.service';
import {
  reportCompletedAnalysis,
  reportFailedAnalysis,
  reportFinishedBatch,
} from './analyzer-telemetry.service';

vi.mock('./api.service', () => ({
  uploadAnalyzerTelemetry: vi.fn(),
}));

function context(): Context {
  return {
    options: { json: false, apiKey: 'test-key' } as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: { name: 'project-a', analysisDurationMs: 12_000, checks: {} },
    handledCheckFailures: [],
    batch: { queue: [], completed: [], failed: [] },
    debug: {
      analyzerTelemetryEnabled: true,
      streamingCheckMetrics: {
        directoriesVisited: 10,
        directoryEntries: 20,
        filesVisited: 100,
        directoryErrors: 0,
        eligibleFiles: 80,
        logicalCheckFileMatches: 70,
        evaluationsCompleted: 60,
        filesRead: 50,
        bytesRead: 1_000,
        statCalls: 100,
        jsonParses: 0,
        yamlParses: 0,
        domParses: 0,
        handledWarnings: 0,
        currentInFlightBytes: 0,
        peakInFlightBytes: 100,
        startedAt: Date.now() - 10_000,
        elapsedMs: 10_000,
      },
      checkExecutionMetrics: [
        {
          name: 'near-timeout',
          type: 'content',
          evaluatorDurationMs: 8_500,
          evaluatedFiles: 50,
          timeoutMs: 10_000,
        },
        {
          name: 'healthy',
          type: 'content',
          evaluatorDurationMs: 1_000,
          evaluatedFiles: 50,
          timeoutMs: 10_000,
        },
      ],
    },
  };
}

describe('analyzer telemetry', () => {
  beforeEach(() => {
    vi.mocked(api.uploadAnalyzerTelemetry)
      .mockReset()
      .mockResolvedValue(undefined);
  });

  it('reports only checks approaching their evaluator timeout budget', async () => {
    await reportCompletedAnalysis(context());

    expect(api.uploadAnalyzerTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 1,
        eventType: 'analysis.completed',
        projectName: 'project-a',
        data: expect.objectContaining({
          analysisDurationMs: 12_000,
          nearTimeoutChecks: [
            expect.objectContaining({
              checkName: 'near-timeout',
              budgetUsageRatio: 0.85,
            }),
          ],
        }),
      })
    );
  });

  it('does not report local JSON analysis', async () => {
    const ctx = context();
    ctx.options.json = true;

    await reportCompletedAnalysis(ctx);

    expect(api.uploadAnalyzerTelemetry).not.toHaveBeenCalled();
  });

  it('reports the original failure with an explicit batch project identity', async () => {
    const failure = new TypeError('Clone failed');

    await reportFailedAnalysis(context(), failure, 'batch-project');

    expect(api.uploadAnalyzerTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'analysis.failed',
        projectName: 'batch-project',
        data: expect.objectContaining({
          errorName: 'TypeError',
          message: 'Clone failed',
        }),
      })
    );
  });

  it('reports one correlated batch summary event', async () => {
    await reportFinishedBatch(context(), {
      runId: 'gitlab:12:456',
      invocationId: 'd55beea5-43d8-4e88-b773-485081900519',
      batchName: 'shard-2.json',
      ciProvider: 'gitlab',
      startedAt: '2026-08-05T10:00:00.000Z',
      durationMs: 30_000,
      status: 'partial',
      projectsQueued: 50,
      cachePlanningStatus: 'completed',
      cachePlanningDurationMs: 500,
      cacheCheckedProjects: 48,
      cacheHitProjects: 35,
      unresolvedHeadProjects: 2,
      jobsStarted: 15,
      jobsSucceeded: 14,
      jobsFailed: 1,
      jobsSkipped: 0,
      slowestProjects: [],
      shardIndex: 2,
      shardCount: 4,
    });

    expect(api.uploadAnalyzerTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'batch.finished',
        projectName: 'shard-2.json',
        data: expect.objectContaining({
          runId: 'gitlab:12:456',
          cacheHitProjects: 35,
        }),
      })
    );
  });
});
