import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

import { Context } from '../../interface';
import {
  ProjectAnalysisResult,
  ProjectAnalysisResultCounts,
  ProjectSkipReason,
} from '../project-analysis';

import { resolveBatchTelemetryRunContext } from './ci';
import {
  BatchTelemetryData,
  BatchTelemetryState,
  BatchTelemetryStatus,
} from './types';

const STATE_KEY = 'batchTelemetry';
const SLOWEST_PROJECT_LIMIT = 5;

export function initializeBatchTelemetry(
  ctx: Context,
  projectsQueued: number
): BatchTelemetryState {
  const existing = getState(ctx);
  if (existing) {
    existing.projectsQueued = projectsQueued;
    return existing;
  }

  const invocationId = randomUUID();
  const runContext = resolveBatchTelemetryRunContext(invocationId);
  const state: BatchTelemetryState = {
    ...runContext,
    invocationId,
    batchName: basename(ctx.options.jobPath ?? './omniboard-job.json'),
    startedAtMs: ctx.debug.commandStartedAt ?? Date.now(),
    projectsQueued,
    planningStatus: 'not-run',
    planningDurationMs: 0,
    projectsCheckedForChanges: 0,
    projectsWithUnresolvedHead: 0,
    projectsAnalyzed: 0,
    projectsSkippedByReason: createSkipReasonCounts(),
    projectsFailed: 0,
    projectStartedAt: new Map(),
    slowestProjects: [],
  };
  ctx.debug[STATE_KEY] = state;
  return state;
}

export function startProjectPlanning(ctx: Context, now = Date.now()): void {
  const state = ensureState(ctx);
  state.planningStatus = 'running';
  state.planningStartedAt = now;
}

export function completeProjectPlanning(
  ctx: Context,
  result: {
    checkedProjects: number;
    unchangedProjects: number;
    unresolvedHeadProjects: number;
  },
  now = Date.now()
): void {
  const state = ensureState(ctx);
  state.planningStatus = 'completed';
  state.planningDurationMs = elapsed(state.planningStartedAt, now);
  state.projectsCheckedForChanges = result.checkedProjects;
  state.projectsSkippedByReason.unchanged = result.unchangedProjects;
  state.projectsWithUnresolvedHead = result.unresolvedHeadProjects;
}

export function failProjectPlanning(
  ctx: Context,
  unresolvedHeadProjects: number,
  now = Date.now()
): void {
  const state = ensureState(ctx);
  state.planningStatus = 'unavailable';
  state.planningDurationMs = elapsed(state.planningStartedAt, now);
  state.projectsWithUnresolvedHead = unresolvedHeadProjects;
}

export function startProjectAnalysis(
  ctx: Context,
  source: string,
  now = Date.now()
): void {
  const state = ensureState(ctx);
  if (!state.projectStartedAt.has(source)) {
    state.projectStartedAt.set(source, now);
  }
}

export function finishProjectAnalysis(
  ctx: Context,
  source: string,
  projectName: string,
  result: ProjectAnalysisResult,
  now = Date.now()
): void {
  const state = ensureState(ctx);
  const startedAt = state.projectStartedAt.get(source);
  if (startedAt === undefined) {
    return;
  }
  state.projectStartedAt.delete(source);

  if (result.outcome === 'analyzed') {
    state.projectsAnalyzed += 1;
  } else if (result.outcome === 'failed') {
    state.projectsFailed += 1;
  } else {
    state.projectsSkippedByReason[result.reason] += 1;
  }

  state.slowestProjects = [
    ...state.slowestProjects,
    {
      projectName,
      durationMs: elapsed(startedAt, now),
      outcome: result.outcome,
      skipReason: result.outcome === 'skipped' ? result.reason : undefined,
    },
  ]
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, SLOWEST_PROJECT_LIMIT);
}

export function getBatchResultCounts(
  ctx: Context
): ProjectAnalysisResultCounts {
  const state = ensureState(ctx);
  const skipped = sumSkipReasons(state.projectsSkippedByReason);

  return {
    analyzed: state.projectsAnalyzed,
    skipped,
    skippedByReason: { ...state.projectsSkippedByReason },
    failed: state.projectsFailed,
  };
}

export function createBatchTelemetryData(
  ctx: Context,
  status: BatchTelemetryStatus,
  now = Date.now()
): BatchTelemetryData {
  const state = ensureState(ctx);
  if (state.planningStatus === 'running') {
    state.planningStatus = 'unavailable';
    state.planningDurationMs = elapsed(state.planningStartedAt, now);
  }
  const resultCounts = getBatchResultCounts(ctx);

  return {
    runId: state.runId,
    invocationId: state.invocationId,
    batchName: state.batchName,
    ciProvider: state.ciProvider,
    startedAt: new Date(state.startedAtMs).toISOString(),
    durationMs: elapsed(state.startedAtMs, now),
    status,
    projectsQueued: state.projectsQueued,
    planningStatus: state.planningStatus,
    planningDurationMs: state.planningDurationMs,
    projectsCheckedForChanges: state.projectsCheckedForChanges,
    projectsWithUnresolvedHead: state.projectsWithUnresolvedHead,
    projectsAnalyzed: resultCounts.analyzed,
    projectsSkipped: resultCounts.skipped,
    projectsSkippedByReason: resultCounts.skippedByReason,
    projectsFailed: resultCounts.failed,
    slowestProjects: state.slowestProjects,
    shardIndex: state.shardIndex,
    shardCount: state.shardCount,
  };
}

function ensureState(ctx: Context): BatchTelemetryState {
  return (
    getState(ctx) ??
    initializeBatchTelemetry(
      ctx,
      ctx.batch.queue.length +
        ctx.batch.analyzed.length +
        ctx.batch.skipped.length +
        ctx.batch.failed.length
    )
  );
}

function getState(ctx: Context): BatchTelemetryState | undefined {
  return ctx.debug[STATE_KEY] as BatchTelemetryState | undefined;
}

function createSkipReasonCounts(): Record<ProjectSkipReason, number> {
  return { unchanged: 0, excluded: 0, unresolved: 0 };
}

function sumSkipReasons(counts: Record<ProjectSkipReason, number>): number {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function elapsed(startedAt: number | undefined, now: number): number {
  return Math.max(0, now - (startedAt ?? now));
}
