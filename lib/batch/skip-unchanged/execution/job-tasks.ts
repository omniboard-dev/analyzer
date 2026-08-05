import { ListrTask } from 'listr2';

import { Context } from '../../../interface';
import { writeJson } from '../../../services/fs.service';
import { getRepoNameFromUrl } from '../../../services/git.service';

import { getAnalysisPlan } from '../state';

type JobTaskFactory = (job: string, index: number, total: number) => ListrTask;

export function createJobTasks(
  ctx: Context,
  jobs: string[],
  fallback: JobTaskFactory
): ListrTask[] {
  return jobs.map(
    (job, index) =>
      createSkipUnchangedJobTask(ctx, job, index + 1, jobs.length) ??
      fallback(job, index + 1, jobs.length)
  );
}

function createSkipUnchangedJobTask(
  ctx: Context,
  job: string,
  index: number,
  total: number
): ListrTask | undefined {
  const plan = getAnalysisPlan(ctx, job);
  const decision = plan?.decision;
  const entry = plan?.entry;
  if (decision?.action !== 'skip' || !entry) {
    return undefined;
  }

  return {
    title: `${index} / ${total} - ${getRepoNameFromUrl(job)}`,
    task: (ctx: Context, task) => {
      ctx.batch.skipped.push({ source: job, reason: decision.reason });
      ctx.batch.queue = ctx.batch.queue.filter((queued) => queued !== job);
      if (!ctx.options.preserveQueue) {
        writeJson(ctx.options.jobPath, ctx.batch);
      }
      task.title = `${task.title} skipped (${
        decision.reason
      }, ${entry.headSha.slice(0, 12)})`;
    },
  };
}
