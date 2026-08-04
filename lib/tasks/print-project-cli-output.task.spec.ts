import { Listr } from 'listr2';
import { describe, expect, it, vi } from 'vitest';

import { Context } from '../interface';

import { printProjectCliOutputTask } from './print-project-cli-output.task';

function createContext(): Context {
  return {
    options: {} as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: {
      name: 'fixture-project',
      checks: {},
    },
    handledCheckFailures: [],
    batch: { queue: [], completed: [], failed: [] },
    debug: {},
  };
}

describe('printProjectCliOutputTask', () => {
  it('prints the complete result and allows subsequent tasks to run', async () => {
    const ctx = createContext();
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const afterPrint = vi.fn();
    const tasks = new Listr(
      [
        printProjectCliOutputTask,
        {
          title: 'After print',
          task: afterPrint,
        },
      ],
      { renderer: 'silent' }
    );

    await expect(tasks.run(ctx)).resolves.toBe(ctx);

    expect(consoleLog).toHaveBeenCalledWith(
      JSON.stringify(ctx.results, null, 2)
    );
    expect(afterPrint).toHaveBeenCalledOnce();
  });
});
