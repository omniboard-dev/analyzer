import { ListrTask } from 'listr2';

import { BatchJob, Context } from '../../interface';
import { readJson, writeJson } from '../../services/fs.service';

const DEFAULT_JOB: BatchJob = {
  running: '',
  queue: [],
  completed: [],
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
      task.title = `${task.title} - created new job file at ${jobPath}`;
    } else {
      task.title = `${task.title} successful, found ${job.queue?.length} jobs`;
    }
    ctx.batchJob = job;
  },
};
