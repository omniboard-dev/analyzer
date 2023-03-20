import { ListrTask, ListrTaskWrapper, ListrDefaultRenderer } from 'listr2';

import {
  CheckType,
  ContentCheckDefinition,
  Context,
  ParentTask,
  XPathCheckDefinition,
} from '../interface';
import { sizeCheckTaskFactory } from '../checks/size.check';
import { xpathCheckTaskFactory } from '../checks/xpath.check';
import { contentCheckTaskFactory } from '../checks/content.check';
import { resolveActiveFlags } from '../utils/regexp';
import {
  CheckResultSymbol,
  resolveCheckParentTaskProgress,
} from '../checks/check.service';
import { fileCheckTaskFactory } from '../checks/file.check';
import { jsonCheckTaskFactory } from '../checks/json.check';

const DEFAULT_PROJECT_NAME_PATTERN_FLAGS = 'i';

export const runChecksTask: ListrTask = {
  title: '',
  skip: (ctx: Context) => {
    if (ctx.control.skipEverySubsequentTask) {
      return true;
    }
    if (
      (!ctx.definitions.checks || !ctx.definitions.checks?.length) &&
      !ctx.options.checkDefinition
    ) {
      return `No checks found`;
    } else {
      return false;
    }
  },
  task: async (ctx: Context, task) => {
    const checkTasks = buildTasks(ctx, task);
    task.title += `${checkTasks.length} applicable checks found, 0/${checkTasks.length}`;
    return task.newListr(checkTasks, {
      concurrent: checkTasks?.length < 100,
    });
  },
};

function buildTasks(ctx: Context, parentTask: ParentTask): ListrTask[] {
  const checksDefinitionsFromApi = ctx.definitions?.checks ?? [];
  const checksDefinitionsFromCli = ctx.options?.checkDefinition
    ? [JSON.parse(ctx.options.checkDefinition)]
    : [];
  const checkDefinitions = (
    checksDefinitionsFromCli.length
      ? checksDefinitionsFromCli
      : checksDefinitionsFromApi
  ).filter((definition) => {
    if (
      ctx.options.checkPattern &&
      !new RegExp(ctx.options.checkPattern, 'i').test(definition.name)
    ) {
      return false;
    }
    return definition.type !== CheckType.META;
  });
  return checkDefinitions.map((definition) => ({
    title: `[${definition.type.padEnd(7, ' ')}] "${definition.name}"`,
    skip: async (ctx: Context): Promise<any> => {
      if (definition.disabled) {
        resolveCheckParentTaskProgress(parentTask);
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
          resolveCheckParentTaskProgress(parentTask);
          return `${CheckResultSymbol.SKIPPED} [${definition.type.padEnd(
            7,
            ' '
          )}] "${definition.name}": project ${ctx.results.name} doesn't match ${
            definition.projectNamePattern
          }`;
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
          definition as ContentCheckDefinition,
          parentTask
        );
      } else if (definition.type === CheckType.XPATH) {
        return xpathCheckTaskFactory(
          definition as XPathCheckDefinition,
          parentTask
        );
      } else if (definition.type === CheckType.SIZE) {
        return sizeCheckTaskFactory(definition, parentTask);
      } else if (definition.type === CheckType.FILE) {
        return fileCheckTaskFactory(definition, parentTask);
      } else if (definition.type === CheckType.JSON) {
        return jsonCheckTaskFactory(definition, parentTask);
      } else {
        return function unknownCheckTask(
          ctx: Context,
          task: ListrTaskWrapper<Context, ListrDefaultRenderer>
        ) {
          task.skip(
            `Implementation for a check with type "${definition.type}" not found`
          );
          resolveCheckParentTaskProgress(parentTask);
        };
      }
    })(),
  }));
}
