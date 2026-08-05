import { ListrTask } from 'listr2';

import { Context } from '../interface';

export const startAnalysisDurationTask: ListrTask = {
  title: 'Start analysis timer',
  task: (ctx: Context) => {
    ctx.debug.analysisStartedAt = Date.now();
  },
};

export const recordAnalysisDurationTask: ListrTask = {
  title: 'Record analysis duration',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  task: (ctx: Context, task) => {
    ctx.results.analysisDurationMs = getAnalysisDurationMs(ctx);
    task.title = `${task.title}: ${ctx.results.analysisDurationMs}ms`;
  },
};

export function getAnalysisDurationMs(ctx: Context, now = Date.now()): number {
  return Math.max(0, now - (ctx.debug.analysisStartedAt ?? now));
}
