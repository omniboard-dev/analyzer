import { ListrTask, ListrTaskWrapper, ListrDefaultRenderer } from 'listr2';

import { CheckType, Context } from '../interface';
import { sizeCheckTaskFactory } from '../checks/size.check';
import { contentCheckTaskFactory } from '../checks/content.check';
import { resolveActiveFlags } from '../utils/regexp';

const DEFAULT_PROJECT_NAME_PATTERN_FLAGS = 'i';

export const runChecksTask: ListrTask = {
  title: 'Run project checks',
  skip: (ctx: Context) => {
    if (!ctx.definitions.checks || !ctx.definitions.checks?.length) {
      return `No checks found`;
    } else {
      return false;
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
            resolveActiveFlags(
              definition.projectNamePatternFlags,
              DEFAULT_PROJECT_NAME_PATTERN_FLAGS
            )
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
            task: ListrTaskWrapper<Context, ListrDefaultRenderer>
          ) {
            task.skip(
              `Implementation for a check with type "${definition.type}" not found`
            );
          };
        }
      })()
    }));

    return task.newListr(checkTasks, {
      concurrent: true
    });
  }
};
