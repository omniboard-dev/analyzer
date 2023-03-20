import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import {
  ContentCheckDefinition,
  Context,
  ParentTask,
  ProjectCheckMatch,
  ProjectCheckMatchDetails,
} from '../interface';
import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT,
} from '../consts';
import { resolveActiveFlags } from '../utils/regexp';
import * as fs from '../services/fs.service';

import {
  CheckResultSymbol,
  getCheckFiles,
  resolveCheckParentTaskProgress,
  resolveCheckTaskFulfilledTitle,
} from './check.service';

const DEFAULT_CONTENT_PATTERN_FLAGS = 'ig';

export function contentCheckTaskFactory(
  definition: ContentCheckDefinition,
  parentTask: ParentTask
) {
  async function contentCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type, contentPattern, contentPatternFlags } = definition;
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
      resolveCheckParentTaskProgress(parentTask);
      return;
    }

    return new Promise<void>((resolve, reject) => {
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
              (m) =>
                ({
                  match: m[0],
                  groups: m.groups,
                } as ProjectCheckMatchDetails)
            ),
          });
        }
        finishedCounter++;
        if (finishedCounter >= files.length) {
          ctx.results.checks![name] = {
            name,
            type,
            value: matches.length > 0,
            matches,
          };
          task.title = resolveCheckTaskFulfilledTitle(task, matches);
          resolveCheckParentTaskProgress(parentTask);
          resolve();
        }
      }
    });
  }
  return contentCheckTask;
}
