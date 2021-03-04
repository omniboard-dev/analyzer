import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import { DEFAULT_CHECK_EXECUTION_TIMEOUT } from '../consts';
import { CheckDefinition, Context } from '../interface';

import { getCheckFiles } from './check.service';

export function xpathCheckTaskFactory(definition: CheckDefinition) {
  async function xpathCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type } = definition;
    const files = getCheckFiles(definition);

    task.title = `${task.title}, found ${files.length} files`;

    if (!files.length) {
      ctx.results.checks![name] = {
        name,
        type,
        value: false
      };
      return;
    }

    return new Promise((resolve, reject) => {
      setTimeout(
        () => reject(`Check "${name}" timeout`),
        DEFAULT_CHECK_EXECUTION_TIMEOUT
      );
    });
  }
  return xpathCheckTask;
}
