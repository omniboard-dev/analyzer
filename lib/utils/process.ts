import { Listr, ListrTask, PRESET_TIMER } from 'listr2';

import { Context, Options } from '../interface';
import { Logger } from '../services/logger.service';

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
  const start = new Date().getTime();
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
    debug: {},
  };
  const rootTasks = new Listr<Context, RunnerRenderer, 'simple'>(tasks, {
    ...createRunnerRendererOptions(options),
  });

  try {
    const ctx = await rootTasks.run(context);
    const duration = new Date().getTime() - start;

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
        logger.error(`[FAILED] ${project}`);
      });
      rootTasks.errors.forEach((error) => {
        logger.error(`[FAILED] ${error}`);
      });
    }

    process.exitCode = 0;
    return;
  } catch (err: any) {
    const duration = new Date().getTime() - start;

    if (options.errorsAsWarnings) {
      logger.warning(`Finished (${formatTime(duration)}) with error`);
      logger.warning(err);
      if (err?.response?.body?.message) {
        logger.warning(err.response.body.message);
      }
      rootTasks.errors.forEach((error) => {
        logger.warning(error);
      });
      process.exitCode = 0;
    } else {
      logger.error(`Finished (${formatTime(duration)}) with error`);
      logger.error(err);
      if (err?.response?.body?.message) {
        logger.error(err.response.body.message);
      }
      rootTasks.errors.forEach((error) => {
        logger.error(error);
      });
      process.exitCode = 1;
    }

    return;
  }
};
