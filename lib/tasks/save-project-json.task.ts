import Listr, { ListrTask } from 'listr';

import * as fs from '../services/fs.service';

export const saveProjectJsonTask: ListrTask = {
  title: 'Save project (local json file)',
  task: (ctx, task) =>
    new Listr([
      {
        title: 'Save project data',
        task: (ctx, task) => {
          return fs.writeJson('./dist/omniboard.json', ctx.projectData);
        }
      }
    ])
};
