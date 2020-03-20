import { ListrTask } from 'listr';

import { Context } from '../interface';
import * as api from '../services/api.service';

export const saveProjectApiTask: ListrTask = {
  title: 'Save project (Omniboard.dev)',
  skip: (ctx: Context) => {
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    }
  },
  task: (ctx, task) => api.uploadProject(ctx.processedResults)
};
