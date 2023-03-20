import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import { ContentCheckDefinition, Context, ParentTask } from '../interface';
import { DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT } from '../consts';

import {
  CheckResultSymbol,
  getCheckFiles,
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
    const files = getCheckFiles(
      definition,
      DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT
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
  }
  return fileCheckTask;
}
