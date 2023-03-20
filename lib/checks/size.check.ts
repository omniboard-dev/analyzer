import { ListrTaskWrapper, ListrDefaultRenderer } from 'listr2';

import {
  BaseCheckDefinition,
  Context,
  ParentTask,
  ProjectCheckSizeDetails,
} from '../interface';
import * as fs from '../services/fs.service';
import { DEFAULT_EXCLUDE_FILES_PATTERN_SIZE } from '../consts';

import {
  getCheckFiles,
  resolveCheckParentTaskProgress,
  resolveCheckTaskFulfilledTitle,
} from './check.service';

export function sizeCheckTaskFactory(
  definition: BaseCheckDefinition,
  parentTask: ParentTask
) {
  async function contentCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type } = definition;

    const files = getCheckFiles(definition, DEFAULT_EXCLUDE_FILES_PATTERN_SIZE);

    task.title = `${task.title}, found ${files.length} files`;

    const sizeDetails: ProjectCheckSizeDetails[] = [];
    for (const file of files) {
      const size = fs.getFileSize(file);
      sizeDetails.push({
        file,
        size,
        sizeHumanReadable: fs.getHumanReadableFileSize(size),
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
        details: sizeDetails,
      },
    };
    task.title = task.title = resolveCheckTaskFulfilledTitle(task, files);
    resolveCheckParentTaskProgress(parentTask);
  }
  return contentCheckTask;
}
