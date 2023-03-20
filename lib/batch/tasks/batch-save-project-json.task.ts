import { ListrTask } from 'listr2';

import * as fs from '../../services/fs.service';
import { Context } from '../../interface';
import { getRepoNameFromUrl } from '../../services/git.service';

export function batchSaveProjectJsonTaskFactory(job: string): ListrTask {
  return {
    title: `Save project (local json file)`,
    skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
    enabled: (ctx: Context) => ctx.options.json,
    task: async (ctx: Context, task) => {
      const path = `../_dist/${getRepoNameFromUrl(job)}.json`;
      fs.writeJson(path, ctx.processedResults);
      task.title = `${task.title}, saved to: ${path}`;
    },
  };
}
