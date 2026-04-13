import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import { ContentCheckDefinition, Context, ParentTask } from '../interface';

import {
  CheckResultSymbol,
  getCheckFiles,
  getDefaultExcludeFilesPatternContent,
  resolveCheckParentTaskProgress,
} from './check.service';

export function fileCheckTaskFactory(
  definition: ContentCheckDefinition,
  parentTask: ParentTask
) {
  async function fileCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type } = definition;
    try {
      const files = getCheckFiles(
        ctx,
        definition,
        getDefaultExcludeFilesPatternContent(ctx)
      );

      task.title = `${task.title}, found ${files.length} files`;

      if (!files.length) {
        ctx.results.checks![name] = {
          name,
          type,
          value: false,
        };
        task.title = `${CheckResultSymbol.UNFULFILLED} ${task.title}`;
        resolveCheckParentTaskProgress(parentTask);
        return;
      } else {
        ctx.results.checks![name] = {
          name,
          type,
          value: true,
          matches: files.map((file) => ({
            file,
            matches: [],
          })),
        };
        task.title = `${CheckResultSymbol.FULFILLED} ${task.title}`;
        resolveCheckParentTaskProgress(parentTask);
      }
    } catch (err: any) {
      const error = new Error(`[file] "${name}"\n   Error: ${err.message}`);
      ctx.handledCheckFailures.push(error);
      task.title = `${CheckResultSymbol.ERROR} ${task.title} - ${err.message}`;
      resolveCheckParentTaskProgress(parentTask);
    }
  }
  return fileCheckTask;
}
