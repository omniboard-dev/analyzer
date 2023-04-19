import { ListrTask } from 'listr2';

import * as api from '../services/api.service';
import { Context } from '../interface';
import { getHumanReadableFileSize } from '../services/fs.service';

export const saveProjectApiTask: ListrTask = {
  title: 'Save project results (Omniboard.dev)',
  skip: (ctx: Context) => {
    if (ctx.control.skipEverySubsequentTask) {
      return true;
    }
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      ctx.control.skipEverySubsequentTask = true;
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    } else {
      return false;
    }
  },
  task: async (ctx, task) => {
    return api.uploadProject(ctx.results).then(() => {
      const resultsLength = Buffer.byteLength(
        JSON.stringify(ctx.results),
        'utf8'
      );
      task.title = `${task.title} successful, ${getHumanReadableFileSize(
        resultsLength
      )}`;
    });
  },
};
