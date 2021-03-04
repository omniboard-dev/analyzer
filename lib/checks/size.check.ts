import { ListrTaskWrapper, ListrDefaultRenderer } from 'listr2';

import {
  CheckDefinition,
  Context,
  ProjectCheckSizeDetails
} from '../interface';
import * as fs from '../services/fs.service';

import { getCheckFiles } from './check.service';

export function sizeCheckTaskFactory(definition: CheckDefinition) {
  async function contentCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type } = definition;

    const files = getCheckFiles(definition);

    task.title = `${task.title}, found ${files.length} files`;

    const sizeDetails: ProjectCheckSizeDetails[] = [];
    for (const file of files) {
      const size = fs.getFileSize(file);
      sizeDetails.push({
        file,
        size,
        sizeHumanReadable: fs.getHumanReadableFileSize(size)
      });
    }
    sizeDetails.sort((s1, s2) => s2.size - s1.size);
    const total = sizeDetails.reduce((r, s) => r + s.size, 0);
    const totalHumanReadable = fs.getHumanReadableFileSize(total);
    ctx.results.checks![name] = {
      name,
      type,
      value: files.length > 0,
      size: {
        total,
        totalHumanReadable,
        details: sizeDetails
      }
    };
  }
  return contentCheckTask;
}
