import { ListrTask } from 'listr';

import { Context } from '../interface';
import * as api from '../services/api.service';

export const testConnectionTask: ListrTask = {
  title: 'Test connection',
  skip: (ctx: Context) => {
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    }
  },
  task: async (ctx, task) => {
    const { organization } = await api.ping();
    if (organization) {
      task.title = `${task.title} successful, organization: ${organization}`;
    } else {
      throw new Error('Organization not found');
    }
  }
};
