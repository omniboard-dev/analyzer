import Listr, { ListrTask } from 'listr';

import { Context } from '../interface';
import { findFiles, readJson } from '../services/fs.service';

export const projectInfoTask: ListrTask = {
  title: 'Resolve basic project info',
  task: (ctx, task) =>
    new Listr(
      [
        {
          title: 'Get project name',
          task: (ctx: Context, task) => {
            const files = findFiles('package.json');
            const names = files.map(f => readJson(f).name).filter(Boolean);

            ctx.results.name = names[0];
            ctx.results.info = {
              name: names[0],
              names
            };
          }
        },
        {
          title: 'Get project repository',
          task: (ctx: Context, task) => {
            const files = findFiles('package.json');
            const repositories = Array.from(
              new Set(
                files
                  .map(f => readJson(f)?.repository?.url)
                  .filter(Boolean)
                  .map(url => url.replace('git+', ''))
              )
            );

            ctx.results.info = {
              ...ctx.results.info,
              repository: repositories[0],
              repositories
            } as any;
          }
        }
      ],
      {}
    )
};
