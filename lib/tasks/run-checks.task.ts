import Listr, { ListrTask, ListrTaskWrapper } from 'listr';

import { CheckType, Context } from '../interface';
import { sizeCheckTaskFactory } from '../checks/size.check';
import { contentCheckTaskFactory } from '../checks/content.check';

export const runChecksTask: ListrTask = {
  title: 'Run project checks',
  skip: (ctx: Context) => {
    if (!ctx.definitions.checks || !ctx.definitions.checks?.length) {
      return `No checks found`;
    }
  },
  task: async (ctx: Context, task) => {
    const checkTasks: any = ctx.definitions.checks!.map(definition => ({
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
      task: (() => {
        if (definition.type === CheckType.CONTENT) {
          return contentCheckTaskFactory(definition);
        } else if (definition.type === CheckType.SIZE) {
          return sizeCheckTaskFactory(definition);
        } else {
          return function unknownCheckTask(
            ctx: Context,
            task: ListrTaskWrapper
          ) {
            task.skip(
              `Implementation for a check with type "${definition.type}" not found`
            );
          };
        }
      })()
    }));

    return new Listr(checkTasks);
  }
};
