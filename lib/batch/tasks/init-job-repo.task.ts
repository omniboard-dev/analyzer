import { ListrTask } from 'listr2';

import {
  getRepoNameFromUrl,
  cloneRepo,
  pullLatest,
} from '../../services/git.service';
import { Context } from '../../interface';
import {
  directoryExists,
  pathJoin,
  removeDirectoryRecursive,
} from '../../services/fs.service';

export function initJobRepo(job: string): ListrTask {
  return {
    title: 'Init job repo',
    task: async (ctx: Context, task) => {
      const { workspacePath, verbose } = ctx.options;
      const repoName = getRepoNameFromUrl(job);
      const repoPath = pathJoin(workspacePath, repoName);
      try {
        if (!directoryExists(repoPath)) {
          await cloneRepo(job, workspacePath);
          task.title = `${task.title}, cloned`;
        } else {
          try {
            await pullLatest(repoPath);
            task.title = `${task.title}, updated`;
          } catch (error) {
            task.title = `${task.title}, git pull failed, remove and retry to clone`;
            removeDirectoryRecursive(repoPath);
            await cloneRepo(job, workspacePath);
            task.title = `${task.title}, cloned`;
          }
        }
        process.chdir(repoPath);
      } catch (error: any) {
        throw error;
      }
    },
  };
}
