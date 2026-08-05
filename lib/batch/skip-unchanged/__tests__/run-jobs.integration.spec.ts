import { describe, expect, it, vi } from 'vitest';

import { Context } from '../../../interface';

import { runJobTaskFactory } from '../../tasks/run-job.task';
import { runJobsTask } from '../../tasks/run-jobs.task';
import { setAnalysisPlans } from '../state';

vi.mock('../../tasks/run-job.task', () => ({
  runJobTaskFactory: vi.fn(() => ({ title: 'analyze' })),
}));

const SOURCE = 'https://gitlab.example.com/group/project.git';

describe('runJobsTask skip-unchanged integration', () => {
  it('selects the clone-free task for an unchanged project', async () => {
    const ctx = {
      batch: { queue: [SOURCE], completed: [], failed: [] },
      control: { skipEverySubsequentTask: false },
      debug: {},
    } as Context;
    setAnalysisPlans(ctx, {
      [SOURCE]: {
        unchanged: true,
        entry: { headSha: 'a'.repeat(40) } as any,
      },
    });
    const task = { newListr: vi.fn((tasks) => tasks) };

    await (runJobsTask.task as any)(ctx, task);

    expect(task.newListr.mock.calls[0][0][0].title).toBe('1 / 1 - project');
    expect(runJobTaskFactory).not.toHaveBeenCalled();
  });
});
