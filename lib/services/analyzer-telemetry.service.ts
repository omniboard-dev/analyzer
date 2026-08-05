import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

import { CheckExecutionTimeoutError } from '../checks/engine/types';
import { Context } from '../interface';
import { getAnalysisDurationMs } from '../tasks/analysis-duration.task';

import { uploadAnalyzerTelemetry } from './api.service';
import { createLogger } from './logger.service';

const ANALYZER_TELEMETRY_SCHEMA_VERSION = 1;
const NEAR_TIMEOUT_RATIO = 0.8;
const MAX_NEAR_TIMEOUT_CHECKS = 5;
const logger = createLogger('ANALYZER TELEMETRY');
const { version: analyzerVersion } = require('../../package.json') as {
  version: string;
};

type AnalyzerTelemetryEventType =
  | 'analysis.completed'
  | 'analysis.failed'
  | 'check.timeout';

interface AnalyzerTelemetryEvent {
  eventId: string;
  schemaVersion: number;
  eventType: AnalyzerTelemetryEventType;
  occurredAt: string;
  analyzerVersion: string;
  projectName: string;
  data: Record<string, unknown>;
}

export async function reportCompletedAnalysis(ctx: Context): Promise<void> {
  if (!shouldReport(ctx)) {
    return;
  }

  const metrics = ctx.debug.streamingCheckMetrics;
  const nearTimeoutChecks = (ctx.debug.checkExecutionMetrics ?? [])
    .filter(
      ({ evaluatorDurationMs, timeoutMs }) =>
        timeoutMs !== undefined &&
        timeoutMs > 0 &&
        evaluatorDurationMs / timeoutMs >= NEAR_TIMEOUT_RATIO
    )
    .sort(
      (left, right) =>
        right.evaluatorDurationMs / right.timeoutMs! -
        left.evaluatorDurationMs / left.timeoutMs!
    )
    .slice(0, MAX_NEAR_TIMEOUT_CHECKS)
    .map(({ name, type, evaluatorDurationMs, evaluatedFiles, timeoutMs }) => ({
      checkName: name,
      checkType: type,
      evaluatorDurationMs: Math.round(evaluatorDurationMs),
      evaluatedFiles,
      timeoutMs,
      budgetUsageRatio: roundRatio(evaluatorDurationMs / timeoutMs!),
    }));

  await send(ctx, 'analysis.completed', {
    analysisDurationMs:
      ctx.results.analysisDurationMs ?? getAnalysisDurationMs(ctx),
    checkEngineDurationMs: metrics?.elapsedMs ?? 0,
    metrics: metrics
      ? {
          directoriesVisited: metrics.directoriesVisited,
          filesVisited: metrics.filesVisited,
          eligibleFiles: metrics.eligibleFiles,
          evaluationsCompleted: metrics.evaluationsCompleted,
          filesRead: metrics.filesRead,
          bytesRead: metrics.bytesRead,
          handledWarnings: metrics.handledWarnings,
        }
      : undefined,
    nearTimeoutChecks,
  });
}

export async function reportFailedAnalysis(
  ctx: Context,
  error: unknown,
  projectName?: string
): Promise<void> {
  if (!shouldReport(ctx)) {
    return;
  }

  const failure =
    ctx.debug.analyzerTelemetryError instanceof CheckExecutionTimeoutError
      ? ctx.debug.analyzerTelemetryError
      : error;
  const common = {
    analysisDurationMs: getAnalysisDurationMs(ctx),
    errorName: failure instanceof Error ? failure.name : 'Error',
    message: resolveErrorMessage(failure),
  };

  if (failure instanceof CheckExecutionTimeoutError) {
    await send(
      ctx,
      'check.timeout',
      {
        ...common,
        checkName: failure.check.name,
        checkType: failure.check.type,
        evaluatorDurationMs: Math.round(failure.check.evaluatorDurationMs),
        evaluatedFiles: failure.check.evaluatedFiles,
        timeoutMs: failure.check.timeoutMs,
        budgetUsageRatio: roundRatio(
          failure.check.evaluatorDurationMs / failure.check.timeoutMs!
        ),
      },
      projectName
    );
    return;
  }

  await send(ctx, 'analysis.failed', common, projectName);
}

function shouldReport(ctx: Context): boolean {
  return Boolean(
    ctx.debug.analyzerTelemetryEnabled &&
      !ctx.options.json &&
      (ctx.options.apiKey || process.env.OMNIBOARD_API_KEY)
  );
}

async function send(
  ctx: Context,
  eventType: AnalyzerTelemetryEventType,
  data: Record<string, unknown>,
  projectName?: string
): Promise<void> {
  const event: AnalyzerTelemetryEvent = {
    eventId: randomUUID(),
    schemaVersion: ANALYZER_TELEMETRY_SCHEMA_VERSION,
    eventType,
    occurredAt: new Date().toISOString(),
    analyzerVersion,
    projectName: projectName ?? ctx.results.name ?? basename(process.cwd()),
    data,
  };

  try {
    await uploadAnalyzerTelemetry(event);
  } catch (error) {
    logger.debug(
      `Unable to report ${eventType}: ${resolveErrorMessage(error)}`
    );
  }
}

function resolveErrorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(
    0,
    2_000
  );
}

function roundRatio(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
