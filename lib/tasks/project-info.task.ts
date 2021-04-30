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
          task: (ctx: Context, task) => {
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
              names = findProjectNamesMaven();
              ctx.results.name = names[0];
              ctx.results.info = {
                type: ProjectType.MAVEN,
                name: names[0],
                names
              };
            }

            if (!names.length) {
              task.title = `${task.title}: no project found`;
              ctx.control.skipEverySubsequentTask = true;
            } else {
              task.title = `${task.title}: ${ctx.results.name} [${ctx.results?.info?.type}]`;
            }

            const {
              projectsBlacklistPattern,
              projectsBlacklistExplicit
            } = ctx.settings;
            if (
              projectsBlacklistPattern &&
              new RegExp(projectsBlacklistPattern, 'i').test(names[0])
            ) {
              task.title = `${task.title} - project name matched by blacklist pattern`;
              ctx.control.skipEverySubsequentTask = true;
            }
            if (
              projectsBlacklistExplicit &&
              projectsBlacklistExplicit.some(
                projectName => projectName === names[0]
              )
            ) {
              task.title = `${task.title} - project name was explicitly blacklisted`;
              ctx.control.skipEverySubsequentTask = true;
            }
          }
        },
        {
          title: 'Get project repository',
          skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
          task: async (ctx: Context, task) => {
            let repositories: string[] = [];

            if (ctx.results.info?.type === ProjectType.NPM) {
              repositories = findProjectRepositoriesNpm();
            }
            if (ctx.results.info?.type === ProjectType.MAVEN) {
              repositories = findProjectRepositoriesMaven();
            }

            ctx.results.info = {
              ...ctx.results.info,
              repository: repositories[0],
              repositories
            } as any;

            if (ctx.results.info?.repository) {
              task.title = `${task.title}: ${ctx.results.info?.repository}`;
            }
          }
        }
      ],
      { rendererOptions: {} }
    )
};
