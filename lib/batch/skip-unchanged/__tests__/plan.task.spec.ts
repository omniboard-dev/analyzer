import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../../../interface';
import * as api from '../../../services/api.service';
import * as git from '../../../services/git.service';

import { planUnchangedJobsTask } from '../planning/plan.task';
import { getAnalysisPlan } from '../state';

vi.mock('../../../services/api.service', () => ({
  planProjectAnalyses: vi.fn(),
}));
vi.mock('../../../services/git.service', () => ({
  getRemoteHead: vi.fn(),
}));

const SOURCE = 'https://gitlab.example.com/group/project.git';

describe('planUnchangedJobsTask', () => {
  beforeEach(() => {
    vi.mocked(git.getRemoteHead)
      .mockReset()
      .mockResolvedValue({
        ref: 'refs/heads/main',
        sha: 'a'.repeat(40),
      });
    vi.mocked(api.planProjectAnalyses).mockReset();
  });

  it('records an exact server cache hit as unchanged', async () => {
    vi.mocked(api.planProjectAnalyses).mockImplementation(async (candidates) =>
      candidates.map(({ sourceKey }) => ({ sourceKey, unchanged: true }))
    );
    const ctx = context();
    const task = { title: 'Plan unchanged projects', skip: vi.fn() };

    await (planUnchangedJobsTask.task as any)(ctx, task);

    expect(getAnalysisPlan(ctx, SOURCE)?.unchanged).toBe(true);
    expect(task.title).toContain('1 unchanged, 0 to analyze');
  });

  it('falls back to normal analysis when the cache API is unavailable', async () => {
    vi.mocked(api.planProjectAnalyses).mockRejectedValue(
      new Error('Endpoint unavailable')
    );
    const ctx = context();
    const task = { title: 'Plan unchanged projects', skip: vi.fn() };

    await (planUnchangedJobsTask.task as any)(ctx, task);

    expect(getAnalysisPlan(ctx, SOURCE)).toBeUndefined();
    expect(task.skip).toHaveBeenCalledWith(
      'Analysis cache unavailable; all projects will be analyzed'
    );
  });

  it('does not use server cache for local JSON output', () => {
    const ctx = context();
    ctx.options.json = true;

    expect((planUnchangedJobsTask.skip as any)(ctx)).toContain('Local JSON');
  });
});

function context(): Context {
  return {
    options: {
      errorsAsWarnings: false,
      sanitizeRepoUrl: true,
      json: false,
      skipUnchanged: true,
    },
    settings: {},
    definitions: { checks: [] },
    control: { skipEverySubsequentTask: false },
    batch: { queue: [SOURCE], completed: [], failed: [] },
    debug: {},
  } as Context;
}
