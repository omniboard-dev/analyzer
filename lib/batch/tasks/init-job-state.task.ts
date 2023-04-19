import { ListrTask } from 'listr2';

import { directoryExists } from '../../services/fs.service';
import { Context } from '../../interface';

export const initJobStateTask: ListrTask = {
  title: 'Init job state',
  task: async (ctx: Context, task) => {
    await task.task.pause(200);
    // reset job CTX state
    ctx.control = { skipEverySubsequentTask: false };
    ctx.results = { checks: {} };
    ctx.handledCheckFailures = [];

    // reset cwd
    if (!directoryExists(ctx.options.workspacePath)) {
      process.chdir('../../');
    }

    task.title = `${task.title} successful`;
  },
};
