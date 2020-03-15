import Listr, { ListrTask } from 'listr';

import { findFiles, readJson } from '../services/fs.service';

export const projectInfoTask: ListrTask = {
  title: 'Resolve basic project info',
  task: (ctx, task) =>
    new Listr(
      [
        {
          title: 'Get poject name',
          task: (ctx, task) => {
            const files = findFiles('package.json');
            const names = files.map(f => readJson(f).name).filter(Boolean);
            ctx.name = names[0];
            ctx.names = names;
          }
        }
      ],
      {}
    )
};
