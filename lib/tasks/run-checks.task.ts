import { ListrTask, ListrTaskWrapper, ListrDefaultRenderer } from 'listr2';

import {
  CheckType,
  ContentCheckDefinition,
  Context,
  XPathCheckDefinition
} from '../interface';
import { sizeCheckTaskFactory } from '../checks/size.check';
import { xpathCheckTaskFactory } from '../checks/xpath.check';
import { contentCheckTaskFactory } from '../checks/content.check';
import { resolveActiveFlags } from '../utils/regexp';
import { CheckResultSymbol } from '../checks/check.service';

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
    const checkTasks: any = ctx.definitions
      .checks!.filter(definition => {
        if (
          ctx.options.checkPattern &&
          !new RegExp(ctx.options.checkPattern, 'i').test(definition.name)
        ) {
          return false;
        }
        return definition.type !== CheckType.META;
      })
      .map(definition => ({
        title: `[${definition.type.padEnd(7, ' ')}] "${definition.name}"`,
        skip: async (ctx: Context): Promise<any> => {
          if (definition.disabled) {
            return `${CheckResultSymbol.SKIPPED} [${definition.type.padEnd(
              7,
              ' '
            )}] "${definition.name}": DISABLED`;
          } else if (definition.projectNamePattern) {
            const projectNameRegexp = new RegExp(
              definition.projectNamePattern,
              resolveActiveFlags(
                definition.projectNamePatternFlags,
                DEFAULT_PROJECT_NAME_PATTERN_FLAGS
              )
            );
            if (!projectNameRegexp.test(ctx.results.name || '')) {
              return `${CheckResultSymbol.SKIPPED} [${definition.type.padEnd(
                7,
                ' '
              )}] "${definition.name}": project ${
                ctx.results.name
              } doesn't match ${definition.projectNamePattern}`;
            } else {
              return false;
            }
          } else {
            return false;
          }
        },
        task: (() => {
          if (definition.type === CheckType.CONTENT) {
            return contentCheckTaskFactory(
              definition as ContentCheckDefinition
            );
          } else if (definition.type === CheckType.XPATH) {
            return xpathCheckTaskFactory(
              definition as XPathCheckDefinition,
              ctx
            );
          } else if (definition.type === CheckType.SIZE) {
            return sizeCheckTaskFactory(definition);
          } else {
            return function unknownCheckTask(
              ctx: Context,
              task: ListrTaskWrapper<Context, ListrDefaultRenderer>
            ) {
              task.skip(
                `Implementation for a with type "${definition.type}" not found`
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
