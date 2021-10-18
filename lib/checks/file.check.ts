import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import { ContentCheckDefinition, Context } from '../interface';
import { DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT } from '../consts';

import { CheckResultSymbol, getCheckFiles } from './check.service';

export function fileCheckTaskFactory(definition: ContentCheckDefinition) {
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
    }
  }
  return fileCheckTask;
}
