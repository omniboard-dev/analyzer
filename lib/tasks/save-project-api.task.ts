import Listr, { ListrTask } from 'listr';

import * as api from '../services/api.service';

export const saveProjectApiTask: ListrTask = {
  title: 'Save project (Omniboard)',
  task: (ctx, task) =>
    new Listr([
      {
        title: 'Save project data',
        task: (ctx, task) => {
          return api.uploadProject(ctx.projectData);
        }
      }
    ])
};
