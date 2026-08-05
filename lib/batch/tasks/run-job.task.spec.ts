import { ListrErrorTypes } from 'listr2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../../interface';
import { reportFailedAnalysis } from '../../services/analyzer-telemetry.service';

import { runJobTaskFactory } from './run-job.task';

vi.mock('../../services/analyzer-telemetry.service', () => ({
  reportFailedAnalysis: vi.fn(),
}));

const JOB = 'https://gitlab.com/example/sample-project.git';

function createContext(): Context {
  return {
    options: { preserveQueue: true } as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: { checks: {} },
    handledCheckFailures: [],
    batch: { queue: [JOB], analyzed: [], skipped: [], failed: [] },
    debug: { analysisStartedAt: Date.now() },
  };
}

describe('runJobTaskFactory', () => {
  beforeEach(() => {
    vi.mocked(reportFailedAnalysis).mockReset().mockResolvedValue(undefined);
  });

  it('reports the original nested failure with the repository identity', async () => {
    const ctx = createContext();
    const jobTask = runJobTaskFactory(JOB, 1, 1);
    const failure = new TypeError('Clone failed');
    const nestedTasks = {
      errors: [
        {
          type: ListrErrorTypes.HAS_FAILED,
          error: failure,
        },
      ],
    };
    const task = {
      title: '1 / 1 - sample-project',
      newListr: vi.fn(() => nestedTasks),
    };

    await (jobTask.task as any)(ctx, task);
    await (jobTask.rollback as any)(ctx, task);

    expect(reportFailedAnalysis).toHaveBeenCalledWith(
      ctx,
      failure,
      'sample-project'
    );
  });
});
