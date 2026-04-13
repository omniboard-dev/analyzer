import { BaseCheckDefinition, Context, ParentTask } from '../interface';
import { resolveActiveFlags } from '../utils/regexp';
import * as fs from '../services/fs.service';

const FALLBACK_INCLUDE_FILES_FLAG = 'i';
const FALLBACK_EXCLUDE_FILES_PATTERN_FLAGS = 'i';
const FALLBACK_EXCLUDE_FILES_PATTERN_XPATH = `((^|\\/)\\.|node_modules|coverage|dist|.teamcity)`;
const FALLBACK_EXCLUDE_FILES_PATTERN_CONTENT = `((^|\\/)\\.|node_modules|coverage|dist)`;
const FALLBACK_EXCLUDE_FILES_PATTERN_SIZE = `node_modules`;
const FALLBACK_CHECK_EXECUTION_TIMEOUT = 10_000;

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
  ctx: Context,
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
    resolveActiveFlags(
      filesPatternFlags,
      ctx.settings.analyzerIncludeFilesFlag || FALLBACK_INCLUDE_FILES_FLAG
    ),
    filesExcludePattern || defaultExcludeFilesPattern,
    resolveActiveFlags(
      filesExcludePatternFlags,
      ctx.settings.analyzerExcludeFilesPatternFlags ||
        FALLBACK_EXCLUDE_FILES_PATTERN_FLAGS
    )
  );
}

export function getDefaultExcludeFilesPatternContent(ctx: Context) {
  return (
    ctx.settings.analyzerExcludeFilesPatternContent ||
    FALLBACK_EXCLUDE_FILES_PATTERN_CONTENT
  );
}

export function getDefaultExcludeFilesPatternXPath(ctx: Context) {
  return (
    ctx.settings.analyzerExcludeFilesPatternXpath ||
    FALLBACK_EXCLUDE_FILES_PATTERN_XPATH
  );
}

export function getDefaultExcludeFilesPatternSize(ctx: Context) {
  return (
    ctx.settings.analyzerExcludeFilesPatternSize ||
    FALLBACK_EXCLUDE_FILES_PATTERN_SIZE
  );
}

export function getCheckExecutionTimeout(ctx: Context) {
  return (
    ctx.settings.analyzerCheckExecutionTimeout ||
    FALLBACK_CHECK_EXECUTION_TIMEOUT
  );
}
