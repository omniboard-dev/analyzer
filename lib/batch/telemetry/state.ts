import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

import { Context } from '../../interface';

import { resolveBatchTelemetryRunContext } from './ci';
import {
  BatchJobStatus,
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
    cachePlanningStatus: 'not-run',
    cachePlanningDurationMs: 0,
    cacheCheckedProjects: 0,
    cacheHitProjects: 0,
    unresolvedHeadProjects: 0,
    jobsStarted: 0,
    jobsSucceeded: 0,
    jobsFailed: 0,
    jobsSkipped: 0,
    jobStartedAt: new Map(),
    slowestProjects: [],
  };
  ctx.debug[STATE_KEY] = state;
  return state;
}

export function startCachePlanning(ctx: Context, now = Date.now()): void {
  const state = ensureState(ctx);
  state.cachePlanningStatus = 'running';
  state.cachePlanningStartedAt = now;
}

export function completeCachePlanning(
  ctx: Context,
  result: {
    checkedProjects: number;
    cacheHitProjects: number;
    unresolvedHeadProjects: number;
  },
  now = Date.now()
): void {
  const state = ensureState(ctx);
  state.cachePlanningStatus = 'completed';
  state.cachePlanningDurationMs = elapsed(state.cachePlanningStartedAt, now);
  state.cacheCheckedProjects = result.checkedProjects;
  state.cacheHitProjects = result.cacheHitProjects;
  state.unresolvedHeadProjects = result.unresolvedHeadProjects;
}

export function failCachePlanning(
  ctx: Context,
  unresolvedHeadProjects: number,
  now = Date.now()
): void {
  const state = ensureState(ctx);
  state.cachePlanningStatus = 'unavailable';
  state.cachePlanningDurationMs = elapsed(state.cachePlanningStartedAt, now);
  state.unresolvedHeadProjects = unresolvedHeadProjects;
}

export function startBatchJob(
  ctx: Context,
  source: string,
  now = Date.now()
): void {
  const state = ensureState(ctx);
  if (!state.jobStartedAt.has(source)) {
    state.jobStartedAt.set(source, now);
    state.jobsStarted += 1;
  }
}

export function finishBatchJob(
  ctx: Context,
  source: string,
  projectName: string,
  status: BatchJobStatus,
  now = Date.now()
): void {
  const state = ensureState(ctx);
  const startedAt = state.jobStartedAt.get(source);
  if (startedAt === undefined) {
    return;
  }
  state.jobStartedAt.delete(source);

  if (status === 'succeeded') {
    state.jobsSucceeded += 1;
  } else if (status === 'failed') {
    state.jobsFailed += 1;
  } else {
    state.jobsSkipped += 1;
  }

  state.slowestProjects = [
    ...state.slowestProjects,
    { projectName, durationMs: elapsed(startedAt, now), status },
  ]
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, SLOWEST_PROJECT_LIMIT);
}

export function createBatchTelemetryData(
  ctx: Context,
  status: BatchTelemetryStatus,
  now = Date.now()
): BatchTelemetryData {
  const state = ensureState(ctx);
  if (state.cachePlanningStatus === 'running') {
    state.cachePlanningStatus = 'unavailable';
    state.cachePlanningDurationMs = elapsed(state.cachePlanningStartedAt, now);
  }

  return {
    runId: state.runId,
    invocationId: state.invocationId,
    batchName: state.batchName,
    ciProvider: state.ciProvider,
    startedAt: new Date(state.startedAtMs).toISOString(),
    durationMs: elapsed(state.startedAtMs, now),
    status,
    projectsQueued: state.projectsQueued,
    cachePlanningStatus: state.cachePlanningStatus,
    cachePlanningDurationMs: state.cachePlanningDurationMs,
    cacheCheckedProjects: state.cacheCheckedProjects,
    cacheHitProjects: state.cacheHitProjects,
    unresolvedHeadProjects: state.unresolvedHeadProjects,
    jobsStarted: state.jobsStarted,
    jobsSucceeded: state.jobsSucceeded,
    jobsFailed: state.jobsFailed,
    jobsSkipped: state.jobsSkipped,
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
        ctx.batch.completed.length +
        ctx.batch.failed.length
    )
  );
}

function getState(ctx: Context): BatchTelemetryState | undefined {
  return ctx.debug[STATE_KEY] as BatchTelemetryState | undefined;
}

function elapsed(startedAt: number | undefined, now: number): number {
  return Math.max(0, now - (startedAt ?? now));
}
