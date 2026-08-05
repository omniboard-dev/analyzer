import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context, ParentTask } from '../../interface';
import { writeJson } from '../../services/fs.service';
import { recordAnalyzedProject } from '../skip-unchanged';
import { finishProjectAnalysis } from '../telemetry/state';

import { finalizeJobTaskFactory } from './finalize-job.task';

vi.mock('../../services/fs.service', () => ({
  writeJson: vi.fn(),
}));
vi.mock('../skip-unchanged', () => ({
  recordAnalyzedProject: vi.fn(),
}));
vi.mock('../telemetry/state', () => ({
  finishProjectAnalysis: vi.fn(),
}));

const JOB = 'https://gitlab.com/example/project-a.git';

function createContext(): Context {
  return {
    options: {
      jobPath: './job.json',
      preserveQueue: false,
    } as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: { name: 'project-a', checks: {} },
    handledCheckFailures: [],
    batch: {
      queue: [JOB],
      analyzed: [],
      skipped: [],
      failed: [],
    },
    debug: {},
  };
}

async function finalize(ctx: Context) {
  const parentTask: ParentTask = { title: '1 / 1 - project-a' };
  const task = { title: 'Finalize job' };

  await (finalizeJobTaskFactory(JOB, parentTask).task as any)(ctx, task);

  return { parentTask, task };
}

describe('finalizeJobTaskFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recordAnalyzedProject).mockResolvedValue(undefined);
    vi.spyOn(process, 'chdir').mockImplementation(() => undefined);
  });

  it('records reusable analysis only after the successful batch state is persisted', async () => {
    const ctx = createContext();

    const { parentTask } = await finalize(ctx);

    expect(ctx.batch).toEqual({
      queue: [],
      analyzed: [JOB],
      skipped: [],
      failed: [],
    });
    expect(writeJson).toHaveBeenCalledWith('./job.json', ctx.batch);
    expect(finishProjectAnalysis).toHaveBeenCalledWith(ctx, JOB, 'project-a', {
      outcome: 'analyzed',
    });
    expect(recordAnalyzedProject).toHaveBeenCalledWith(ctx, 'project-a');
    expect(vi.mocked(writeJson).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(recordAnalyzedProject).mock.invocationCallOrder[0]
    );
    expect(parentTask.title).toBe('1 / 1 - project-a analyzed');
  });

  it('does not record reusable analysis when batch finalization fails', async () => {
    const ctx = createContext();
    (ctx.batch as Partial<Context['batch']>).analyzed = undefined;

    await expect(finalize(ctx)).rejects.toThrow("reading 'push'");

    expect(writeJson).not.toHaveBeenCalled();
    expect(finishProjectAnalysis).not.toHaveBeenCalled();
    expect(recordAnalyzedProject).not.toHaveBeenCalled();
  });

  it('does not record skipped projects as reusable analyses', async () => {
    const ctx = createContext();
    ctx.control.projectSkipReason = 'excluded';

    await finalize(ctx);

    expect(ctx.batch).toEqual({
      queue: [],
      analyzed: [],
      skipped: [{ source: JOB, reason: 'excluded' }],
      failed: [],
    });
    expect(finishProjectAnalysis).toHaveBeenCalledWith(ctx, JOB, 'project-a', {
      outcome: 'skipped',
      reason: 'excluded',
    });
    expect(recordAnalyzedProject).not.toHaveBeenCalled();
  });
});
