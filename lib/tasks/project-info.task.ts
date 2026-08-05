import { ListrTask } from 'listr2';

import { Context, ProjectType } from '../interface';
import {
  findProjectNameCustomProjectResolver,
  findProjectNamesMaven,
  findProjectNamesNpm,
  findProjectNamesPip,
  findProjectNamesRepo,
  findProjectTeamNames,
  findProjectRepositoriesMaven,
  findProjectRepositoriesNpm,
  findProjectRepositoriesRepo,
  isMavenWorkspace,
  isNpmWorkspace,
  isPipWorkspace,
} from '../services/project.service';
import {
  getCurrentBranch,
  getTrackedProjectSize,
} from '../services/git.service';

export const projectInfoTask: ListrTask = {
  title: 'Resolve basic project info',
  task: (ctx, task) =>
    task.newListr(
      [
        {
          title: 'Get project name',
          task: (ctx: Context, task) => {
            const { customProjectResolvers, teamResolvers } = ctx.settings;
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
                names = findProjectNamesMaven((warning) =>
                  addHandledWarning(ctx, warning)
                );
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
              ctx.control.projectSkipReason = 'unresolved';
            } else {
              task.title = `${task.title}: ${ctx.results.name} [${ctx.results?.info?.type}]`;

              const teamNames = findProjectTeamNames(teamResolvers);
              if (ctx.results) {
                ctx.results.team = teamNames;
                ctx.results.info;
              }
              if (teamNames.length) {
                task.title = `${task.title} (Team: ${teamNames.join(', ')})`;
              }
            }

            const projectsBlocklistPattern =
              ctx.settings.projectsBlocklistPattern ??
              ctx.settings.projectsBlacklistPattern;
            const projectsBlocklistExplicit =
              ctx.settings.projectsBlocklistExplicit ??
              ctx.settings.projectsBlacklistExplicit;
            if (
              projectsBlocklistPattern &&
              new RegExp(projectsBlocklistPattern, 'i').test(names[0])
            ) {
              task.title = `${task.title} - project name matched by blocklist pattern`;
              ctx.control.skipEverySubsequentTask = true;
              ctx.control.projectSkipReason = 'excluded';
            }
            if (
              projectsBlocklistExplicit &&
              projectsBlocklistExplicit.some(
                (projectName) => projectName === names[0]
              )
            ) {
              task.title = `${task.title} - project name was explicitly blocklisted`;
              ctx.control.skipEverySubsequentTask = true;
              ctx.control.projectSkipReason = 'excluded';
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
              ctx.options.sanitizeRepoUrl,
              (warning) => addHandledWarning(ctx, warning)
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
        {
          title: 'Count tracked project files',
          skip: (ctx: Context) => ctx.control.skipEverySubsequentTask,
          task: async (ctx: Context, task) => {
            try {
              const projectSize = await getTrackedProjectSize();
              ctx.results.projectSize = projectSize;
              task.title = `${task.title}: ${projectSize.totalFiles} files`;
            } catch (error) {
              ctx.handledCheckFailures.push(
                new Error(
                  `[project-info:project-size] Unable to count Git-tracked files: ${
                    error instanceof Error ? error.message : String(error)
                  }`
                )
              );
              task.skip('Git-tracked file count unavailable');
            }
          },
        },
      ],
      { rendererOptions: {} }
    ),
};

function addHandledWarning(ctx: Context, warning: Error) {
  if (
    !ctx.handledCheckFailures.some(
      (existingWarning) => existingWarning.message === warning.message
    )
  ) {
    ctx.handledCheckFailures.push(warning);
  }
}
