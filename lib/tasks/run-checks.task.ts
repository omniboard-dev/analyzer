import Listr, { ListrTask, ListrTaskWrapper } from 'listr';

import * as fs from '../services/fs.service';
import { Context } from '../interface';
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

        const matches = [];
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
              matches: matchesForFile.map(m => m[0])
            });
          }
        }
        ctx.results.checks![name] = {
          name,
          value: matches.length > 0,
          matches
        };
        const duration = new Date().getTime() - start;
        task.title = `${task.title}, finished (${formatTime(duration)})`;
      }
    }));

    return new Listr(checkTasks);
  }
};
