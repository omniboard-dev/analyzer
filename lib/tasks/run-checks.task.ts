import Listr, { ListrTask, ListrTaskWrapper } from 'listr';

import * as fs from '../services/fs.service';
import {
  Context,
  ProjectCheckMatch,
  ProjectCheckMatchDetails
} from '../interface';
import { formatTime } from '../utils/time';

export const runChecksTask: ListrTask = {
  title: 'Run project checks',
  skip: (ctx: Context) => {
    if (!ctx.definitions.checks || !ctx.definitions.checks?.length) {
      return `No checks found`;
    }
  },
  task: async (ctx: Context, task) => {
    const checkTasks = ctx.definitions.checks!.map(definition => ({
      title: `Check "${definition.name}"`,
      skip: async (ctx: Context): Promise<any> => {
        if (definition.disabled) {
          return 'Check disabled';
        } else if (definition.projectNamePattern) {
          const projectNameRegexp = new RegExp(
            definition.projectNamePattern,
            definition.projectNamePatternFlags || 'i'
          );
          if (!projectNameRegexp.test(ctx.results.name || '')) {
            return `Project name ${ctx.results.name} does not match provided pattern ${definition.projectNamePattern}`;
          } else {
            return false;
          }
        } else {
          return false;
        }
      },
      task: async (ctx: Context, task: ListrTaskWrapper) => {
        const start = new Date().getTime();
        const {
          name,
          filesPattern,
          filesPatternFlags,
          filesExcludePattern,
          filesExcludePatternFlags,
          contentPattern,
          contentPatternFlags
        } = definition;
        const files = fs.findFiles(
          filesPattern,
          filesPatternFlags,
          filesExcludePattern,
          filesExcludePatternFlags
        );
        task.title = `${task.title}, found ${files.length} files`;

        const matches: ProjectCheckMatch[] = [];
        for (const file of files) {
          const content = fs.readFile(file);

          const regexp = new RegExp(
            contentPattern,
            contentPatternFlags || 'ig'
          );
          const matchesForFile = [...content.matchAll(regexp)];
          if (matchesForFile?.length) {
            matches.push({
              file,
              matches: matchesForFile.map(
                m =>
                  ({
                    match: m[0],
                    groups: m.groups
                  } as ProjectCheckMatchDetails)
              )
            });
          }
        }
        ctx.results.checks![name] = {
          name,
          value: matches.length > 0,
          matches
        };
        const duration = new Date().getTime() - start;
        task.title = `${task.title}, matches: ${matches.length} (${formatTime(
          duration
        )})`;
      }
    }));

    return new Listr(checkTasks);
  }
};
