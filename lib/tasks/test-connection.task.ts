import { ListrTask } from 'listr2';

import { Context } from '../interface';
import * as api from '../services/api.service';

export const testConnectionTask: ListrTask = {
  title: 'Verify API destination',
  skip: (ctx: Context) => {
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      ctx.control.skipEverySubsequentTask = true;
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    } else {
      return false;
    }
  },
  task: async (ctx, task) => {
    const identity = await api.ping();
    const { group, organization } = identity;

    if (!organization) {
      throw new Error('Organization not found');
    }

    if (
      ctx.options.expectedGroup &&
      group?.toLowerCase() !== ctx.options.expectedGroup.toLowerCase()
    ) {
      throw new Error(
        `Authenticated Omniboard group "${
          group ?? 'unknown'
        }" does not match expected group "${ctx.options.expectedGroup}"`
      );
    }

    ctx.debug.apiIdentity = identity;
    task.title = `${task.title} successful, organization: ${organization}${
      group ? `, group: ${group}` : ''
    }`;
  },
};
