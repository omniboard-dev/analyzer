import { ListrTask } from 'listr';

import { Context } from '../interface';
import * as fs from '../services/fs.service';

export const saveProjectJsonTask: ListrTask = {
  title: 'Save project (local json file)',
  skip: (ctx: Context) =>
    ctx.options.json
      ? false
      : 'Please provide --json flag to store data in local json file',
  task: (ctx: Context, task) => {
    fs.writeJson(`${ctx.options.jsonPath}`, ctx.processedResults);
    task.title = `${task.title}, saved to: ${ctx.options.jsonPath}`;
  }
};
