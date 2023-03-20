import { ListrTask } from 'listr2';

import {
  getRepoNameFromUrl,
  cloneRepo,
  pullLatest,
} from '../../services/git.service';
import { Context } from '../../interface';
import { directoryExists, pathJoin } from '../../services/fs.service';

export function initJobRepo(job: string): ListrTask {
  return {
    title: 'Init job repo',
    task: async (ctx: Context, task) => {
      const { workspacePath, verbose } = ctx.options;
      const repoName = getRepoNameFromUrl(job);
      const repoPath = pathJoin(workspacePath, repoName);
      if (!directoryExists(repoPath)) {
        await cloneRepo(job, workspacePath);
        task.title = `${task.title}, cloned`;
      } else {
        await pullLatest(repoPath);
        task.title = `${task.title}, updated`;
      }
      process.chdir(repoPath);
    },
  };
}
