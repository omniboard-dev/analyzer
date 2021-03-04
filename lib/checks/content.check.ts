import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN,
  DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS,
  DEFAULT_INCLUDE_FILES_FLAG
} from '../consts';
import { resolveActiveFlags } from '../utils/regexp';
import {
  CheckDefinition,
  Context,
  ProjectCheckMatch,
  ProjectCheckMatchDetails
} from '../interface';
import * as fs from '../services/fs.service';

const DEFAULT_CONTENT_PATTERN_FLAGS = 'ig';

export function contentCheckTaskFactory(definition: CheckDefinition) {
  async function contentCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const {
      name,
      type,
      filesPattern,
      filesPatternFlags,
      filesExcludePattern,
      filesExcludePatternFlags,
      contentPattern,
      contentPatternFlags
    } = definition;
    const files = fs.findFiles(
      filesPattern,
      resolveActiveFlags(filesPatternFlags, DEFAULT_INCLUDE_FILES_FLAG),
      filesExcludePattern || DEFAULT_EXCLUDE_FILES_PATTERN,
      resolveActiveFlags(
        filesExcludePatternFlags,
        DEFAULT_EXCLUDE_FILES_PATTERN_FLAGS
      )
    );

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

      let finishedCounter = 0;
      const matches: ProjectCheckMatch[] = [];
      for (const file of files) {
        const content = fs.readFile(file);

        const activeContentPatternFlags = resolveActiveFlags(
          contentPatternFlags,
          DEFAULT_CONTENT_PATTERN_FLAGS
        );
        const regexp = new RegExp(contentPattern, activeContentPatternFlags);

        const matchesForFile = [];

        let match;
        if (activeContentPatternFlags.includes('g')) {
          // const matchesForFile = [...(content as any).matchAll(regexp)]; // TODO node v12+
          while ((match = regexp.exec(content)) !== null) {
            matchesForFile.push(match);
          }
        } else {
          match = regexp.exec(content);
          if (match) {
            matchesForFile.push(match);
          }
        }

        if (matchesForFile?.length) {
          matches.push({
            file,
            matches: matchesForFile.map(
              m =>
                ({
                  match: m[0],
                  groups: m.groups
                } as ProjectCheckMatchDetails)
            )
          });
        }
        finishedCounter++;
        if (finishedCounter >= files.length) {
          ctx.results.checks![name] = {
            name,
            type,
            value: matches.length > 0,
            matches
          };
          resolve();
        }
      }
    });
  }
  return contentCheckTask;
}
