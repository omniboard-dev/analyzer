import { ListrTask } from 'listr';

import * as api from '../services/api.service';

export const retrieveChecksTask: ListrTask = {
  title: 'Retrieve project checks',
  skip: (ctx) => {
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    }
  },
  task: async (ctx, task) => {
    const checks = await api.getChecks();
    task.title = `${task.title} successful, retrieved ${checks?.length ?? 0} checks`;
  }
};
