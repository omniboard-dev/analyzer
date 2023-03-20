import { ListrTask } from 'listr2';

import { Context } from '../interface';
import { runChecksTask } from './run-checks.task';

export const runChecksWrapperTask: ListrTask = {
  title: 'Run project checks',
  task: async (ctx: Context, task) => {
    return task.newListr([runChecksTask], {
      rendererOptions: { showSubtasks: ctx.options.showCheckSubtasks },
    });
  },
};
