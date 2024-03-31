import { ListrTask } from 'listr2';

import { Context, ProjectType } from '../interface';
import {
  findProjectNameCustomProjectResolver,
  findProjectNamesMaven,
  findProjectNamesNpm,
  findProjectNamesPip,
  findProjectNamesRepo,
  findProjectRepositoriesMaven,
  findProjectRepositoriesNpm,
  findProjectRepositoriesRepo,
  isMavenWorkspace,
  isNpmWorkspace,
  isPipWorkspace,
} from '../services/project.service';
import { getCurrentBranch } from '../services/git.service';

export const projectInfoTask: ListrTask = {
  title: 'Resolve basic project info',
  task: (ctx, task) =>
    task.newListr(
      [
        {
          title: 'Get project name',
          task: (ctx: Context, task) => {
            const { customProjectResolvers } = ctx.settings;
            let names: string[] = [];
            if (customProjectResolvers?.length) {
              for (let resolver of customProjectResolvers) {
                names = findProjectNameCustomProjectResolver(resolver);
                if (names.length) {
                  ctx.results.name = names[0];
                  ctx.results.info = {
                    type: resolver.type,
                    name: names[0],
                    names,
                  };
                  break;
                }
              }
            }

            if (!names.length) {
              if (isNpmWorkspace()) {
                names = findProjectNamesNpm();
                ctx.results.name = names[0];
                ctx.results.info = {
                  type: ProjectType.NPM,
                  name: names[0],
                  names,
                };
              } else if (isMavenWorkspace()) {
                names = findProjectNamesMaven();
                ctx.results.name = names[0];
                ctx.results.info = {
                  type: ProjectType.MAVEN,
                  name: names[0],
                  names,
                };
              } else if (isPipWorkspace()) {
                names = findProjectNamesPip();
                ctx.results.name = names[0];
                ctx.results.info = {
                  type: ProjectType.PIP,
                  name: names[0],
                  names,
                };
              } else {
                names = findProjectNamesRepo();
                ctx.results.name = names[0];
                ctx.results.info = {
                  type: ProjectType.REPO,
                  name: names[0],
                  names,
                };
              }
            }

            if (!names.length) {
              task.title = `${task.title}: no project found`;
              ctx.control.skipEverySubsequentTask = true;
            } else {
              task.title = `${task.title}: ${ctx.results.name} [${ctx.results?.info?.type}]`;
            }

            const { projectsBlacklistPattern, projectsBlacklistExplicit } =
              ctx.settings;
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
                (projectName) => projectName === names[0]
              )
            ) {
              task.title = `${task.title} - project name was explicitly blacklisted`;
              ctx.control.skipEverySubsequentTask = true;
            }
          },
        },
        {
          title: 'Get project repository',
          skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
          task: async (ctx: Context, task) => {
            const repos = findProjectRepositoriesRepo(
              ctx.options.sanitizeRepoUrl
            );
            const reposNpm = findProjectRepositoriesNpm(
              ctx.options.sanitizeRepoUrl
            );
            const reposMaven = findProjectRepositoriesMaven(
              ctx.options.sanitizeRepoUrl
            );
            const repositories = Array.from(
              new Set([...repos, ...reposNpm, ...reposMaven])
            );

            const branch = await getCurrentBranch();

            ctx.results.info = {
              ...ctx.results.info,
              branch,
              repository: repositories[0],
              repositories,
            } as any;

            if (ctx.results.info?.repository) {
              task.title = `${task.title}: ${ctx.results.info?.repository}`;
            }
          },
        },
      ],
      { rendererOptions: {} }
    ),
};
