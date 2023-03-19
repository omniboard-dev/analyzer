import { ListrTask } from 'listr2';

import { Context } from '../../interface';
import { ensureDirectoryExists } from '../../services/fs.service';

export const initWorkspaceTask: ListrTask = {
  title: 'Init workspace',
  task: async (ctx: Context, task) => {
    const { workspacePath } = ctx.options;
    ensureDirectoryExists(workspacePath);
    task.title = `${task.title} successful, workspace initialized ${workspacePath}`;
  },
};
