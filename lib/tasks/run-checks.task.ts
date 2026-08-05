import { ListrTask } from 'listr2';

import { CheckDefinition, Context, ParentTask } from '../interface';
import {
  CheckExecutionSummary,
  StreamingCheckMetrics,
  StreamingCheckProgress,
} from '../checks/engine/types';
import {
  prepareCheckRun,
  runStreamingCheckEngine,
} from '../checks/engine/check-engine';
import { getHumanReadableFileSize } from '../services/fs.service';

enum CheckResultSymbol {
  FULFILLED = '✅',
  UNFULFILLED = '❌',
  ERROR = '⚠️',
}

export const runChecksTask: ListrTask = {
  title: 'Analyze project checks',
  skip: (ctx: Context) => {
    if (ctx.control.skipEverySubsequentTask) {
      return true;
    }
    if (
      (!ctx.definitions.checks || !ctx.definitions.checks.length) &&
      !ctx.options.checkDefinition
    ) {
      return 'No checks found';
    }
    return false;
  },
  task: async (ctx: Context, task) => {
    const definitions = resolveDefinitions(ctx);
    const prepared = prepareCheckRun(ctx, definitions);
    const updateProgress = createProgressReporter(ctx, task);
    task.title = `${task.title}: ${prepared.checks.length} executable, ${prepared.selectorGroups.length} selector groups, ${prepared.skippedChecks.length} skipped`;

    let execution;
    try {
      execution = await runStreamingCheckEngine(ctx, definitions, {
        verbose: ctx.options.verbose,
        onProgress: updateProgress,
      });
    } catch (error) {
      ctx.debug.analyzerTelemetryError = error;
      throw error;
    }

    ctx.results.checks = execution.results;
    ctx.debug.streamingCheckMetrics = execution.metrics;
    ctx.debug.checkExecutionMetrics = execution.checkMetrics;
    task.output = formatFinalMetrics(execution.metrics);
    task.title = `${task.title} - completed in ${formatDuration(
      execution.metrics.elapsedMs
    )}`;

    if (
      !ctx.options.showCheckSubtasks ||
      ctx.options.silent ||
      !execution.summaries.length
    ) {
      return;
    }

    return task.newListr(execution.summaries.map(createCheckSummaryTask), {
      concurrent: false,
      rendererOptions: {
        collapseSubtasks: false,
      },
    });
  },
};

function resolveDefinitions(ctx: Context): CheckDefinition[] {
  if (ctx.options.checkDefinition) {
    return [JSON.parse(ctx.options.checkDefinition) as CheckDefinition];
  }
  return ctx.definitions.checks ?? [];
}

function createProgressReporter(
  ctx: Context,
  task: ParentTask & { output?: string }
) {
  let lastUpdate = 0;
  const interval = ctx.options.verbose ? 1_000 : 200;

  return (progress: StreamingCheckProgress) => {
    if (ctx.options.silent || progress.phase !== 'walking') {
      return;
    }

    const now = Date.now();
    if (progress.elapsedMs !== 0 && now - lastUpdate < interval) {
      return;
    }
    lastUpdate = now;
    task.output = formatProgress(progress, ctx.options.verbose);
  };
}

export function formatProgress(
  progress: StreamingCheckProgress,
  verbose: boolean
): string {
  const elapsedSeconds = Math.max(progress.elapsedMs / 1_000, 0.001);
  const rate = Math.round(progress.filesVisited / elapsedSeconds);
  const base = [
    `${progress.filesVisited.toLocaleString()} files`,
    `${progress.eligibleFiles.toLocaleString()} eligible`,
    `${progress.filesRead.toLocaleString()} read`,
    `${progress.evaluationsCompleted.toLocaleString()} evaluations`,
    getHumanReadableFileSize(progress.bytesRead),
    `${rate.toLocaleString()} files/s`,
  ].join(' · ');

  if (!verbose) {
    return base;
  }

  return [
    base,
    `${progress.directoriesVisited.toLocaleString()} directories`,
    `${progress.handledWarnings.toLocaleString()} warnings`,
    `${getHumanReadableFileSize(progress.currentInFlightBytes)} in flight`,
    progress.currentDirectory
      ? `current=${progress.currentDirectory}`
      : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function formatFinalMetrics(metrics: StreamingCheckMetrics): string {
  return [
    `${metrics.filesVisited.toLocaleString()} files`,
    `${metrics.eligibleFiles.toLocaleString()} eligible`,
    `${metrics.filesRead.toLocaleString()} read`,
    `${metrics.evaluationsCompleted.toLocaleString()} evaluations`,
    getHumanReadableFileSize(metrics.bytesRead),
  ].join(' · ');
}

function createCheckSummaryTask(summary: CheckExecutionSummary): ListrTask {
  const { definition, result, errors, skippedReason } = summary;
  const baseTitle = `[${definition.type.padEnd(7, ' ')}] "${definition.name}"`;

  if (skippedReason) {
    return {
      title: baseTitle,
      task: (_ctx, task) => task.skip(skippedReason),
    };
  }

  const symbol = errors.length
    ? CheckResultSymbol.ERROR
    : result?.value
    ? CheckResultSymbol.FULFILLED
    : CheckResultSymbol.UNFULFILLED;
  const matches = result?.matches?.length ?? 0;

  return {
    title: `${symbol} ${baseTitle}${
      matches ? `, found matches: ${matches}` : ''
    }`,
    task: () => undefined,
  };
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) {
    return `${durationMs}ms`;
  }
  return `${(durationMs / 1_000).toFixed(2)}s`;
}
