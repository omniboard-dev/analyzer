import { ListrTask } from 'listr';

import { Context } from '../interface';
import * as api from '../services/api.service';

export const retrieveChecksTask: ListrTask = {
  title: 'Retrieve project checks',
  skip: (ctx: Context) => {
    // if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
    //   return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    // }
  },
  task: async (ctx: Context, task) => {
    // const checks = await api.getChecks();
    const checks = [
      {
        name: 'isAngular',
        filesPattern: 'package.json',
        contentPattern: '@angular/core'
      }
    ];
    ctx.definitions.checks = checks;
    task.title = `${task.title} successful, retrieved ${checks?.length ??
      0} checks`;
  }
};
