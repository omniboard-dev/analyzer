import {
  DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS,
  DEFAULT_INCLUDE_FILES_FLAG
} from '../consts';
import { BaseCheckDefinition } from '../interface';
import { resolveActiveFlags } from '../utils/regexp';
import * as fs from '../services/fs.service';

export function getCheckFiles(
  definition: BaseCheckDefinition,
  defaultExcludeFilesPattern: string
) {
  const {
    filesPattern,
    filesPatternFlags,
    filesExcludePattern,
    filesExcludePatternFlags
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
