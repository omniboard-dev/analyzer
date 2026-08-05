import { Listr } from 'listr2';
import { describe, expect, it, vi } from 'vitest';

import { Context } from '../interface';

import { handledCheckFailureInfoTask } from './handled-check-failure-info.tast';

function createContext(): Context {
  return {
    options: { silent: true } as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: {
      name: 'pipeline-project',
      analysisDurationMs: 1_234,
      checks: {},
    },
    handledCheckFailures: [
      new Error(
        '[json] "hasDependency"\n   File: package.json\n   Error: Unknown value type'
      ),
    ],
    batch: { queue: [], completed: [], failed: [] },
    debug: {},
  };
}

describe('handledCheckFailureInfoTask', () => {
  it('includes the project name and duration in silent pipeline warnings', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tasks = new Listr([handledCheckFailureInfoTask], {
      renderer: 'silent',
    });

    await tasks.run(createContext());

    expect(consoleLog.mock.calls).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.stringContaining(
            '[pipeline-project] (1s 234ms) [json] "hasDependency"'
          ),
        ]),
      ])
    );
  });
});
