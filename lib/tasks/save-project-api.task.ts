import Listr, { ListrTask } from 'listr';

import * as api from '../services/api.service';

export const saveProjectApiTask: ListrTask = {
  title: 'Save project (Omniboard)',
  skip: (ctx) => {
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    }
  },
  task: (ctx, task) =>
    new Listr([
      {
        title: 'Upload project data',
        task: (ctx, task) => {
          return api.uploadProject(ctx.projectData);
        }
      }
    ])
};
