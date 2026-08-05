import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../../../interface';
import * as api from '../../../services/api.service';
import * as git from '../../../services/git.service';

import {
  prepareAnalyzedRepository,
  recordCompletedAnalysis,
} from '../execution/lifecycle';
import {
  getCurrentAnalysisEntry,
  setAnalysisPlans,
  setCurrentAnalysisEntry,
} from '../state';

vi.mock('../../../services/api.service', () => ({
  completeProjectAnalysis: vi.fn(),
}));
vi.mock('../../../services/git.service', () => ({
  getCurrentCommit: vi.fn(),
}));

const SOURCE = 'https://gitlab.example.com/group/project.git';

describe('skip-unchanged analysis lifecycle', () => {
  beforeEach(() => {
    vi.mocked(api.completeProjectAnalysis).mockReset();
    vi.mocked(git.getCurrentCommit)
      .mockReset()
      .mockResolvedValue('b'.repeat(40));
  });

  it('updates the planned entry to the commit actually analyzed', async () => {
    const ctx = context();
    const entry = cacheEntry();
    setAnalysisPlans(ctx, {
      [SOURCE]: { entry, unchanged: false },
    });

    await prepareAnalyzedRepository(ctx, SOURCE, '/tmp/project');

    expect(git.getCurrentCommit).toHaveBeenCalledWith('/tmp/project');
    expect(getCurrentAnalysisEntry(ctx)?.headSha).toBe('b'.repeat(40));
    expect(getCurrentAnalysisEntry(ctx)?.fingerprint).not.toBe(
      entry.fingerprint
    );
  });

  it('records the current entry for the uploaded project', async () => {
    const ctx = context();
    const entry = cacheEntry();
    setCurrentAnalysisEntry(ctx, entry);

    await recordCompletedAnalysis(ctx, 'project-a');

    expect(api.completeProjectAnalysis).toHaveBeenCalledWith({
      projectName: 'project-a',
      ...entry,
    });
  });

  it('fails open when cache completion is unavailable', async () => {
    const ctx = context();
    setCurrentAnalysisEntry(ctx, cacheEntry());
    vi.mocked(api.completeProjectAnalysis).mockRejectedValue(
      new Error('cache unavailable')
    );

    await expect(
      recordCompletedAnalysis(ctx, 'project-a')
    ).resolves.toBeUndefined();
  });
});

function cacheEntry() {
  return {
    sourceKey: 'a'.repeat(64),
    sourceIdentity: 'gitlab.example.com/group/project',
    headSha: 'a'.repeat(40),
    configDigest: 'c'.repeat(64),
    optionsDigest: 'd'.repeat(64),
    fingerprint: 'e'.repeat(64),
    analyzerVersion: '3.3.0',
  };
}

function context(): Context {
  return { debug: {} } as Context;
}
