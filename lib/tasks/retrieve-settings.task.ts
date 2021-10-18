import { ListrTask } from 'listr2';

import { Context } from '../interface';
import * as api from '../services/api.service';

export const retrieveSettingsTask: ListrTask = {
  title: 'Retrieve settings',
  skip: (ctx: Context) => {
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    } else {
      return false;
    }
  },
  task: async (ctx: Context, task) => {
    ctx.settings = await api.getOrganizationSettings();
  },
};
