import {
  DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS,
  DEFAULT_INCLUDE_FILES_FLAG,
} from '../consts';
import { BaseCheckDefinition, ParentTask } from '../interface';
import { resolveActiveFlags } from '../utils/regexp';
import * as fs from '../services/fs.service';

export enum CheckResultSymbol {
  FULFILLED = '✅',
  UNFULFILLED = '❌',
  UNCHECKED = '➖',
  SKIPPED = '➖',
  ERROR = '⚠️',
}

export function resolveCheckTaskFulfilledTitle(
  { title }: { title: string },
  matches: any[]
) {
  return `${
    matches.length > 0
      ? CheckResultSymbol.FULFILLED
      : CheckResultSymbol.UNFULFILLED
  } ${title}${
    matches.length > 0
      ? `, found matches: ${matches.length}, ~${readableSize(matches)}`
      : ''
  }`;
}

function readableSize(obj: any) {
  try {
    const bytes = new Blob([JSON.stringify(obj)]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return 'unknown';
  }
}

export function resolveCheckParentTaskProgress(parentTask: ParentTask) {
  const regexp = /(?<current>\d*)\//;
  const current = regexp.exec(parentTask.title)?.groups?.current ?? 0;
  parentTask.title = parentTask.title.replace(regexp, `${+current + 1}/`);
}

export function getCheckFiles(
  definition: BaseCheckDefinition,
  defaultExcludeFilesPattern: string
) {
  const {
    filesPattern,
    filesPatternFlags,
    filesExcludePattern,
    filesExcludePatternFlags,
  } = definition;
  return fs.findFiles(
    filesPattern,
    resolveActiveFlags(filesPatternFlags, DEFAULT_INCLUDE_FILES_FLAG),
    filesExcludePattern || defaultExcludeFilesPattern,
    resolveActiveFlags(
      filesExcludePatternFlags,
      DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS
    )
  );
}
