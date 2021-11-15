import { JSONPath } from 'jsonpath-plus';
import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT,
} from '../consts';
import { Context, JSONCheckDefinition, ProjectCheckMatch } from '../interface';
import * as fs from '../services/fs.service';

import {
  CheckResultSymbol,
  getCheckFiles,
  resolveCheckTaskFulfilledTitle,
} from './check.service';

export function jsonCheckTaskFactory(definition: JSONCheckDefinition) {
  async function jsonCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type, jsonPropertyPath } = definition;

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
      return;
    }

    return new Promise<void>((resolve, reject) => {
      setTimeout(
        () => reject(`Check "${name}" timeout`),
        DEFAULT_CHECK_EXECUTION_TIMEOUT
      );

      let finishedCounter = 0;

      const errors: Error[] = [];
      const matches: ProjectCheckMatch[] = [];

      for (const file of files) {
        setTimeout(() => {
          let json;
          try {
            json = JSON.parse(fs.readFile(file));
          } catch (err: any) {
            errors.push(
              new Error(`[json] "${name}" - ${file} - ${err.message}`)
            );
            finishedCounter++;
            if (finishedCounter === files.length) {
              if (errors.length) {
                reject(errors);
              }
            }
            task.title = `${CheckResultSymbol.ERROR} ${task.title} - ${file} - ${err.message}`;
            return;
          }

          const result: any[] = JSONPath({
            path: jsonPropertyPath?.startsWith('$')
              ? jsonPropertyPath
              : `$${jsonPropertyPath}`,
            json,
          });

          if (result.length) {
            matches.push({
              file,
              matches: result.map((r) => ({
                match: jsonPropertyPath,
                groups: {
                  [jsonPropertyPath]: r,
                },
              })),
            });
          }

          finishedCounter++;

          console.log(name, finishedCounter, files.length);
          if (finishedCounter === files.length) {
            if (errors.length) {
              reject(errors);
            }

            ctx.results.checks![name] = {
              name,
              type,
              value: matches.length > 0,
              matches,
            };

            task.title = resolveCheckTaskFulfilledTitle(task, matches);

            resolve();
          }
        });
      }
    });
  }
  return jsonCheckTask;
}
