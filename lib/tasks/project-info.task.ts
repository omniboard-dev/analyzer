import { ListrTask } from 'listr2';

import { Context, ProjectType } from '../interface';
import {
  findProjectNamesMaven,
  findProjectNamesNpm,
  findProjectRepositoriesMaven,
  findProjectRepositoriesNpm,
  isMavenWorkspace,
  isNpmWorkspace
} from '../services/project.service';

export const projectInfoTask: ListrTask = {
  title: 'Resolve basic project info',
  task: (ctx, task) =>
    task.newListr(
      [
        {
          title: 'Get project name',
          task: async (ctx: Context, task) => {
            let names: string[] = [];
            if (isNpmWorkspace()) {
              names = findProjectNamesNpm();
              ctx.results.name = names[0];
              ctx.results.info = {
                type: ProjectType.NPM,
                name: names[0],
                names
              };
            }
            if (isMavenWorkspace()) {
              names = await findProjectNamesMaven();
              ctx.results.name = names[0];
              ctx.results.info = {
                type: ProjectType.MAVEN,
                name: names[0],
                names
              };
            }
          }
        },
        {
          title: 'Get project repository',
          task: async (ctx: Context, task) => {
            let repositories: string[] = [];

            if (ctx.results.info?.type === ProjectType.NPM) {
              repositories = findProjectRepositoriesNpm();
            }
            if (ctx.results.info?.type === ProjectType.MAVEN) {
              repositories = await findProjectRepositoriesMaven();
            }

            ctx.results.info = {
              ...ctx.results.info,
              repository: repositories[0],
              repositories
            } as any;
          }
        }
      ],
      { rendererOptions: { collapse: true } }
    )
};
