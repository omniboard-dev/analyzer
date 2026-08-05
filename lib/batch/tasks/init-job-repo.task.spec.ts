import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../../interface';
import * as fsService from '../../services/fs.service';
import * as git from '../../services/git.service';
import { prepareAnalyzedRepository } from '../skip-unchanged';

import { initJobRepo } from './init-job-repo.task';

vi.mock('../../services/fs.service', () => ({
  directoryExists: vi.fn(),
  pathJoin: vi.fn((...parts: string[]) => parts.join('/')),
  removeDirectoryRecursive: vi.fn(),
}));
vi.mock('../../services/git.service', () => ({
  cloneRepo: vi.fn(),
  getRepoNameFromUrl: vi.fn(() => 'sample-project'),
  pullLatest: vi.fn(),
}));
vi.mock('../skip-unchanged', () => ({
  prepareAnalyzedRepository: vi.fn(),
}));

const JOB = 'https://gitlab.com/example/sample-project.git';

describe('initJobRepo', () => {
  beforeEach(() => {
    vi.mocked(fsService.directoryExists).mockReset().mockReturnValue(true);
    vi.mocked(git.pullLatest).mockReset().mockResolvedValue(undefined);
    vi.mocked(prepareAnalyzedRepository)
      .mockReset()
      .mockResolvedValue(undefined);
    vi.spyOn(process, 'chdir').mockImplementation(() => undefined);
  });

  it('reads Git state before changing into a relative repository path', async () => {
    const ctx = {
      options: { workspacePath: 'omniboard-workspace' },
    } as Context;
    const task = initJobRepo(JOB);

    await (task.task as any)(ctx, { title: 'Init job repo' });

    expect(prepareAnalyzedRepository).toHaveBeenCalledWith(
      ctx,
      JOB,
      'omniboard-workspace/sample-project'
    );
    expect(prepareAnalyzedRepository).toHaveBeenCalledBefore(
      vi.mocked(process.chdir)
    );
  });
});
