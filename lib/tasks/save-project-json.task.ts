import { ListrTask } from 'listr';

import * as fs from '../services/fs.service';

export const saveProjectJsonTask: ListrTask = {
  title: 'Save project (local json file)',
  skip: (ctx) => ctx.options.json ? false : 'Please provide --json flag to store data in local json file',
  task: (ctx, task) => {
    return fs.writeJson(`${ctx.options.jsonPath}`, ctx.projectData);
  }
};
