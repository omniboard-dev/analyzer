import { describe, expect, it } from 'vitest';

import { Context } from '../interface';

import {
  getAnalysisDurationMs,
  recordAnalysisDurationTask,
  startAnalysisDurationTask,
} from './analysis-duration.task';

function createContext(): Context {
  return {
    options: {} as Context['options'],
    control: { skipEverySubsequentTask: false },
    settings: {},
    definitions: {},
    results: { checks: {} },
    handledCheckFailures: [],
    batch: { queue: [], completed: [], failed: [] },
    debug: {},
  };
}

describe('analysis duration tasks', () => {
  it('records elapsed milliseconds on the project results', async () => {
    const ctx = createContext();
    const dateNow = Date.now;
    let now = 1_000;
    Date.now = () => now;

    try {
      await (startAnalysisDurationTask.task as any)(ctx, {});
      now = 3_345;
      await (recordAnalysisDurationTask.task as any)(ctx, {
        title: 'Record analysis duration',
      });
    } finally {
      Date.now = dateNow;
    }

    expect(ctx.results.analysisDurationMs).toBe(2_345);
  });

  it('never returns a negative duration when the system clock moves back', () => {
    const ctx = createContext();
    ctx.debug.analysisStartedAt = 2_000;

    expect(getAnalysisDurationMs(ctx, 1_000)).toBe(0);
  });
});
