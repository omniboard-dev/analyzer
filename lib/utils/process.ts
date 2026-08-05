import { basename } from 'node:path';

import { Listr, ListrTask, PRESET_TIMER } from 'listr2';

import { AnalysisFailure, Context, Options } from '../interface';
import { Logger } from '../services/logger.service';
import { getAnalysisDurationMs } from '../tasks/analysis-duration.task';

import { formatTime } from './time';

type RunnerRenderer = 'default' | 'simple' | 'silent' | 'verbose';

export function createRunnerRendererOptions(
  options: Options,
  stdoutIsTty = process.stdout.isTTY === true
) {
  const renderer: RunnerRenderer = options.silent
    ? 'silent'
    : options.verbose
    ? 'verbose'
    : stdoutIsTty
    ? 'default'
    : 'simple';

  return {
    fallbackRenderer: 'simple' as const,
    fallbackRendererOptions: {
      timer: PRESET_TIMER,
    },
    renderer,
    rendererOptions:
      renderer === 'default'
        ? {
            collapseSubtasks: false,
            formatOutput: 'wrap' as const,
            timer: PRESET_TIMER,
          }
        : renderer === 'silent'
        ? undefined
        : {
            timer: PRESET_TIMER,
          },
  };
}

export const runner = async (
  tasks: ListrTask[],
  options: Options,
  logger: Logger
) => {
  const start = Date.now();
  if (!options.silent) {
    logger.info('Start');
  }
  const context: Context = {
    options,
    settings: {},
    definitions: {},
    control: { skipEverySubsequentTask: false },
    results: { checks: {} },
    handledCheckFailures: [],
    batch: { queue: [], completed: [], failed: [] },
    debug: { analysisStartedAt: start, analysisFailures: [] },
  };
  const rootTasks = new Listr<Context, RunnerRenderer, 'simple'>(tasks, {
    ...createRunnerRendererOptions(options),
  });

  try {
    const ctx = await rootTasks.run(context);
    const duration = Date.now() - start;

    if (!options.silent) {
      logger.info(`Finished (${formatTime(duration)})`);
    }

    const { batch } = ctx;
    if (batch.completed.length || batch.failed.length) {
      if (!options.silent) {
        logger.info(
          `Batch results, queue: ${batch.queue.length}, completed: ${batch.completed.length}, failed: ${batch.failed.length}`
        );
      }

      batch.failed.forEach((project) => {
        const failure = context.debug.analysisFailures?.find(
          ({ source }) => source === project
        );
        logger.error(
          failure
            ? `${formatFailure(failure)} - ${project}`
            : `[FAILED] ${project}`
        );
      });
      rootTasks.errors.forEach((error) => {
        const failure = findFailureForError(
          error,
          context.debug.analysisFailures ?? []
        );
        logger.error(
          `${
            failure
              ? formatFailure(failure)
              : formatCurrentFailure(context, duration)
          } -`,
          error
        );
      });
    }

    process.exitCode = 0;
    return;
  } catch (err: any) {
    const duration = Date.now() - start;
    const analysisDuration = getAnalysisDurationMs(context);
    const projectName = context.results.name ?? basename(process.cwd());
    const failure = `[FAILED] ${projectName} (${formatTime(analysisDuration)})`;

    if (options.errorsAsWarnings) {
      logger.warning(
        `Finished project "${projectName}" (${formatTime(duration)}) with error`
      );
      logger.warning(`${failure} -`, err);
      if (err?.response?.body?.message) {
        logger.warning(`${failure} - ${err.response.body.message}`);
      }
      rootTasks.errors.forEach((error) => {
        logger.warning(`${failure} -`, error);
      });
      process.exitCode = 0;
    } else {
      logger.error(
        `Finished project "${projectName}" (${formatTime(duration)}) with error`
      );
      logger.error(`${failure} -`, err);
      if (err?.response?.body?.message) {
        logger.error(`${failure} - ${err.response.body.message}`);
      }
      rootTasks.errors.forEach((error) => {
        logger.error(`${failure} -`, error);
      });
      process.exitCode = 1;
    }

    return;
  }
};

function formatFailure(failure: AnalysisFailure): string {
  return `[FAILED] ${failure.projectName} (${formatTime(failure.durationMs)})`;
}

function formatCurrentFailure(ctx: Context, durationMs: number): string {
  return `[FAILED] ${ctx.results.name ?? basename(process.cwd())} (${formatTime(
    durationMs
  )})`;
}

function findFailureForError(
  error: unknown,
  failures: AnalysisFailure[]
): AnalysisFailure | undefined {
  const path =
    typeof error === 'object' && error !== null && 'path' in error
      ? (error as { path?: unknown }).path
      : undefined;

  if (!Array.isArray(path)) {
    return;
  }

  return failures.find(({ repositoryName }) =>
    path.some(
      (segment) =>
        typeof segment === 'string' && segment.endsWith(` - ${repositoryName}`)
    )
  );
}
