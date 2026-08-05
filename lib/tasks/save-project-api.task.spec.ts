import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../interface';
import * as api from '../services/api.service';

import { saveProjectApiTask } from './save-project-api.task';

vi.mock('../services/api.service', () => ({
  uploadProject: vi.fn(),
  uploadAnalyzerTelemetry: vi.fn(),
}));

function createContext(errorsAsWarnings: boolean): Context {
  return {
    options: {
      errorsAsWarnings,
    } as Context['options'],
    control: {
      skipEverySubsequentTask: false,
    },
    settings: {
      checkResultSizeLimit: 1,
      totalCheckResultSizeLimit: 10,
    },
    definitions: {},
    results: {
      analysisDurationMs: 2_345,
      checks: {
        small: {
          name: 'small',
          type: 'content',
          value: true,
        },
        huge: {
          name: 'huge',
          type: 'content',
          value: true,
          matches: [
            {
              file: 'huge.ts',
              matches: [
                {
                  match: 'x'.repeat(2_000),
                  groups: {},
                },
              ],
            },
          ],
        },
      },
    },
    handledCheckFailures: [],
    batch: {
      queue: [],
      analyzed: [],
      skipped: [],
      failed: [],
    },
    debug: {},
  };
}

async function runSaveTask(ctx: Context) {
  const task = {
    title: 'Save project results (Omniboard.dev)',
  };
  await (saveProjectApiTask.task as any)(ctx, task);
  return task;
}

describe('saveProjectApiTask', () => {
  beforeEach(() => {
    vi.mocked(api.uploadProject).mockReset().mockResolvedValue(undefined);
  });

  it('does not upload a project excluded by an earlier task', async () => {
    const ctx = createContext(false);
    ctx.control.skipEverySubsequentTask = true;

    await runSaveTask(ctx);

    expect(api.uploadProject).not.toHaveBeenCalled();
  });

  it('aborts before upload with exact size details by default', async () => {
    const ctx = createContext(false);

    await expect(runSaveTask(ctx)).rejects.toThrow(
      /Check result "huge".*exceeds the per-check upload limit/
    );
    expect(api.uploadProject).not.toHaveBeenCalled();
    expect(ctx.handledCheckFailures).toEqual([]);
  });

  it('omits oversized results and uploads the remainder as warnings', async () => {
    const ctx = createContext(true);

    const task = await runSaveTask(ctx);

    expect(api.uploadProject).toHaveBeenCalledWith({
      analysisDurationMs: 2_345,
      checks: {
        small: ctx.results.checks!.small,
      },
    });
    expect(ctx.results.checks).toHaveProperty('huge');
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(ctx.handledCheckFailures[0].message).toMatch(
      /Check result "huge".*was omitted from the upload/
    );
    expect(task.title).toContain('1 oversized check result omitted');
  });
});
