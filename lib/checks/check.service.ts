import {
  DEFAULT_EXCLUDE_FILES_PATTERN,
  DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS,
  DEFAULT_INCLUDE_FILES_FLAG
} from '../consts';
import { CheckDefinition } from '../interface';
import { resolveActiveFlags } from '../utils/regexp';
import * as fs from '../services/fs.service';

export function getCheckFiles(definition: CheckDefinition) {
  const {
    filesPattern,
    filesPatternFlags,
    filesExcludePattern,
    filesExcludePatternFlags
  } = definition;
  return fs.findFiles(
    filesPattern,
    resolveActiveFlags(filesPatternFlags, DEFAULT_INCLUDE_FILES_FLAG),
    filesExcludePattern || DEFAULT_EXCLUDE_FILES_PATTERN,
    resolveActiveFlags(
      filesExcludePatternFlags,
      DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS
    )
  );
}
