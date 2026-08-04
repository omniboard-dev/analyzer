import { ListrTask, PRESET_TIMER } from 'listr2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Options } from '../interface';
import { Logger } from '../services/logger.service';

import { createRunnerRendererOptions, runner } from './process';

function createOptions(overrides: Partial<Options> = {}): Options {
  return {
    errorsAsWarnings: false,
    silent: true,
    verbose: false,
    showCheckSubtasks: false,
    json: false,
    jsonPath: './dist/omniboard.json',
    sanitizeRepoUrl: true,
    jobPath: './omniboard-job.json',
    workspacePath: './omniboard-workspace',
    preserveQueue: false,
    ...overrides,
  };
}

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };
}

const originalExitCode = process.exitCode;

beforeEach(() => {
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe('createRunnerRendererOptions', () => {
  it('uses the interactive renderer only for a standard TTY', () => {
    expect(
      createRunnerRendererOptions(createOptions({ silent: false }), true)
    ).toMatchObject({
      renderer: 'default',
      fallbackRenderer: 'simple',
      fallbackRendererOptions: { timer: PRESET_TIMER },
      rendererOptions: {
        collapseSubtasks: false,
        formatOutput: 'wrap',
        timer: PRESET_TIMER,
      },
    });
  });

  it('uses the simple renderer for standard non-TTY output', () => {
    expect(
      createRunnerRendererOptions(createOptions({ silent: false }), false)
    ).toMatchObject({
      renderer: 'simple',
      fallbackRenderer: 'simple',
      rendererOptions: { timer: PRESET_TIMER },
    });
  });

  it('gives silent and verbose modes precedence over TTY detection', () => {
    expect(createRunnerRendererOptions(createOptions(), true).renderer).toBe(
      'silent'
    );
    expect(
      createRunnerRendererOptions(
        createOptions({ silent: false, verbose: true }),
        false
      ).renderer
    ).toBe('verbose');
  });
});

describe('runner', () => {
  it('completes normally, runs every task, and is quiet on silent success', async () => {
    const logger = createLogger();
    const completed: string[] = [];
    const tasks: ListrTask[] = [
      {
        title: 'First',
        task: () => {
          completed.push('first');
        },
      },
      {
        title: 'Second',
        task: () => {
          completed.push('second');
        },
      },
    ];

    await runner(tasks, createOptions(), logger);

    expect(completed).toEqual(['first', 'second']);
    expect(process.exitCode).toBe(0);
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warning).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets a failing exit code and logs fatal errors', async () => {
    const logger = createLogger();
    const failure: any = new Error('Unable to analyze');
    failure.response = { body: { message: 'Remote failure details' } };

    await runner(
      [
        {
          title: 'Fail',
          task: () => {
            throw failure;
          },
        },
      ],
      createOptions(),
      logger
    );

    expect(process.exitCode).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(failure);
    expect(logger.error).toHaveBeenCalledWith('Remote failure details');
    expect(logger.warning).not.toHaveBeenCalled();
  });

  it('turns fatal errors into warnings and exits successfully when requested', async () => {
    const logger = createLogger();
    const failure = new Error('Allowed failure');

    await runner(
      [
        {
          title: 'Fail',
          task: () => {
            throw failure;
          },
        },
      ],
      createOptions({ errorsAsWarnings: true }),
      logger
    );

    expect(process.exitCode).toBe(0);
    expect(logger.warning).toHaveBeenCalledWith(failure);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('keeps failed batch jobs observable in silent mode', async () => {
    const logger = createLogger();

    await runner(
      [
        {
          title: 'Record failed job',
          task: (ctx: any) => {
            ctx.batch.failed.push('https://example.test/failed.git');
          },
        },
      ],
      createOptions(),
      logger
    );

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      '[FAILED] https://example.test/failed.git'
    );
    expect(process.exitCode).toBe(0);
  });
});
