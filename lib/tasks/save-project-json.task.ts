import { ListrTask } from 'listr2';

import { Context } from '../interface';
import * as fs from '../services/fs.service';

export const saveProjectJsonTask: ListrTask = {
  title: 'Save project results (local json file)',
  skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
  enabled: (ctx: Context) => ctx.options.json,
  task: (ctx: Context, task) => {
    fs.writeJson(`${ctx.options.jsonPath}`, ctx.results);
    task.title = `${task.title}, saved to: ${ctx.options.jsonPath}`;
  },
};
