import { ListrTaskWrapper } from 'listr';

import {
  CheckDefinition,
  Context,
  ProjectCheckSizeDetails
} from '../interface';
import * as fs from '../services/fs.service';
import { formatTime, tick } from '../utils/time';

const DEFAULT_EXCLUDE_PATTERN = 'node_modules';
const DEFAULT_EXCLUDE_PATTERN_FLAGS = 'i';

export function sizeCheckTaskFactory(definition: CheckDefinition) {
  async function contentCheckTask(ctx: Context, task: ListrTaskWrapper) {
    const start = new Date().getTime();
    const {
      name,
      type,
      filesPattern,
      filesPatternFlags,
      filesExcludePattern,
      filesExcludePatternFlags
    } = definition;
    const files = fs.findFiles(
      filesPattern,
      filesPatternFlags,
      filesExcludePattern || DEFAULT_EXCLUDE_PATTERN,
      filesExcludePatternFlags || DEFAULT_EXCLUDE_PATTERN_FLAGS
    );
    task.title = `${task.title}, found ${files.length} files`;

    const sizeDetails: ProjectCheckSizeDetails[] = [];
    for (const file of files) {
      const size = fs.getFileSize(file);
      sizeDetails.push({
        file,
        size,
        sizeHumanReadable: fs.getHumanReadableFileSize(size)
      });
      await tick();
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
    const duration = new Date().getTime() - start;
    task.title = `${
      task.title
    }, total size: ${totalHumanReadable} (${formatTime(duration)})`;
    await tick();
  }
  return contentCheckTask;
}
