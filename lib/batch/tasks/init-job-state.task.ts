import { ListrTask } from 'listr2';

import { directoryExists } from '../../services/fs.service';
import { Context } from '../../interface';
import { wait } from '../../utils/wait';

export const initJobStateTask: ListrTask = {
  title: 'Init job state',
  task: async (ctx: Context, task) => {
    // reset job CTX state
    ctx.control = { skipEverySubsequentTask: false };
    ctx.results = { checks: {} };
    ctx.handledCheckFailures = [];

    // reset cwd
    if (!directoryExists(ctx.options.workspacePath)) {
      process.chdir('../../');
    }

    await wait();

    task.title = `${task.title} successful`;
  },
};
