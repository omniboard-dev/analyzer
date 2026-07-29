import { Listr } from 'listr2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context, Settings } from '../interface';
import * as api from '../services/api.service';
import * as fsService from '../services/fs.service';
import * as git from '../services/git.service';
import { handledCheckFailureInfoTask } from '../tasks/handled-check-failure-info.tast';
import { projectInfoTask } from '../tasks/project-info.task';
import { retrieveChecksTask } from '../tasks/retrieve-checks.task';
import { runChecksWrapperTask } from '../tasks/run-checks-wrapper.task';
import { saveProjectApiTask } from '../tasks/save-project-api.task';
import { saveProjectJsonTask } from '../tasks/save-project-json.task';

import { batchSaveProjectJsonTaskFactory } from './tasks/batch-save-project-json.task';
import { finalizeJobTaskFactory } from './tasks/finalize-job.task';

vi.mock('../services/api.service', () => ({
  getChecks: vi.fn(),
  uploadProject: vi.fn(),
}));

vi.mock('../services/git.service', () => ({
  getCurrentBranch: vi.fn(),
  getRepoNameFromUrl: vi.fn(() => 'rwc-lab-test-rwc'),
}));

vi.mock('../services/project.service', () => ({
  findProjectNameCustomProjectResolver: vi.fn(() => []),
  findProjectNamesMaven: vi.fn(() => []),
  findProjectNamesNpm: vi.fn(() => ['@mobi/rwc-lab-test-rwc']),
  findProjectNamesPip: vi.fn(() => []),
  findProjectNamesRepo: vi.fn(() => []),
  findProjectTeamNames: vi.fn(() => []),
  findProjectRepositoriesMaven: vi.fn(() => []),
  findProjectRepositoriesNpm: vi.fn(() => []),
  findProjectRepositoriesRepo: vi.fn(() => []),
  isMavenWorkspace: vi.fn(() => false),
  isNpmWorkspace: vi.fn(() => true),
  isPipWorkspace: vi.fn(() => false),
}));

const JOB = 'https://gitlab.com/example/rwc-lab-test-rwc.git';

function createContext(settings: Settings): Context {
  return {
    options: {
      json: false,
      preserveQueue: true,
      sanitizeRepoUrl: true,
    } as Context['options'],
    control: {
      skipEverySubsequentTask: false,
    },
    settings,
    definitions: {},
    results: {
      checks: {},
    },
    handledCheckFailures: [],
    batch: {
      queue: [JOB],
      completed: [],
      failed: [],
    },
    debug: {},
  };
}

async function runBlocklistedProject(settings: Settings) {
  const ctx = createContext(settings);
  const parentTask = {
    title: '1 / 1 - rwc-lab-test-rwc',
  };
  const tasks = new Listr(
    [
      projectInfoTask,
      runChecksWrapperTask,
      batchSaveProjectJsonTaskFactory(JOB),
      saveProjectApiTask,
      handledCheckFailureInfoTask,
      finalizeJobTaskFactory(JOB, parentTask),
    ],
    {
      renderer: 'silent',
    }
  );

  await tasks.run(ctx);

  return { ctx, parentTask };
}

async function runBlocklistedAnalyze(settings: Settings) {
  const ctx = createContext(settings);
  ctx.options.json = true;
  ctx.options.jsonPath = '/tmp/blocklisted-project.json';

  const tasks = new Listr(
    [
      projectInfoTask,
      retrieveChecksTask,
      runChecksWrapperTask,
      saveProjectJsonTask,
      saveProjectApiTask,
      handledCheckFailureInfoTask,
    ],
    {
      renderer: 'silent',
    }
  );

  await tasks.run(ctx);

  return ctx;
}

describe('blocklisted project flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(api.getChecks).mockReset().mockResolvedValue([]);
    vi.mocked(api.uploadProject).mockReset().mockResolvedValue(undefined);
    vi.mocked(git.getCurrentBranch).mockReset().mockResolvedValue('main');
    vi.spyOn(fsService, 'writeJson').mockImplementation(() => undefined);
    vi.spyOn(process, 'chdir').mockImplementation(() => undefined);
  });

  it('skips all repository work in the single-project analyze flow', async () => {
    const ctx = await runBlocklistedAnalyze({
      projectsBlocklistPattern: '-lab-',
    });

    expect(ctx.control.skipEverySubsequentTask).toBe(true);
    expect(git.getCurrentBranch).not.toHaveBeenCalled();
    expect(api.getChecks).not.toHaveBeenCalled();
    expect(fsService.writeJson).not.toHaveBeenCalled();
    expect(api.uploadProject).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'pattern',
      settings: {
        projectsBlocklistPattern: '-lab-',
      },
    },
    {
      name: 'explicit project name',
      settings: {
        projectsBlocklistExplicit: ['@mobi/rwc-lab-test-rwc'],
      },
    },
    {
      name: 'legacy API field',
      settings: {
        projectsBlacklistPattern: '-lab-',
      },
    },
  ])(
    'skips a project matched by $name without failing the batch',
    async ({ settings }) => {
      const { ctx, parentTask } = await runBlocklistedProject(settings);

      expect(git.getCurrentBranch).not.toHaveBeenCalled();
      expect(api.uploadProject).not.toHaveBeenCalled();
      expect(ctx.batch).toEqual({
        queue: [],
        completed: [JOB],
        failed: [],
      });
      expect(parentTask.title).toBe('1 / 1 - rwc-lab-test-rwc skipped');
    }
  );
});
