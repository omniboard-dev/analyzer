import { ListrTask } from 'listr2';

import { Batch, Context } from '../../interface';
import { readJson, writeJson } from '../../services/fs.service';
import { initializeBatchTelemetry } from '../telemetry/state';

const DEFAULT_JOB: Batch = {
  queue: [],
  analyzed: [],
  skipped: [],
  failed: [],
};

export const initJobTask: ListrTask = {
  title: 'Init job',
  task: async (ctx: Context, task) => {
    const { jobPath } = ctx.options;
    let job = readJson(jobPath);
    if (!job) {
      job = DEFAULT_JOB;
      writeJson(jobPath, job);
      task.title = `${task.title} successful, created new job file at ${jobPath}`;
    } else {
      task.title = `${task.title} successful, found ${jobPath} with ${job.queue?.length} jobs`;
    }
    ctx.batch = job;
    initializeBatchTelemetry(ctx, ctx.batch.queue?.length ?? 0);
    if (!ctx.batch.queue?.length) {
      ctx.control.skipEverySubsequentTask = true;
    }
  },
};
