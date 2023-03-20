import { ListrTask } from 'listr2';

import { Context } from '../interface';
import * as api from '../services/api.service';

export const saveProjectApiTask: ListrTask = {
  title: 'Save project results (Omniboard.dev)',
  skip: (ctx: Context) => {
    if (ctx.control.skipEverySubsequentTask) {
      return true;
    }
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    } else {
      return false;
    }
  },
  task: async (ctx, task) => {
    // try to prevent OOM in case of large result
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
    return api.uploadProject(ctx.results);
  },
};
