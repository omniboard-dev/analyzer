import YAML from 'yaml';
import * as jq from 'node-jq';
import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT,
} from '../consts';
import {
  Context,
  ParentTask,
  ProjectCheckMatch,
  YAMLCheckDefinition,
} from '../interface';
import * as fs from '../services/fs.service';

import {
  CheckResultSymbol,
  getCheckFiles,
  resolveCheckParentTaskProgress,
  resolveCheckTaskFulfilledTitle,
} from './check.service';

export function yamlCheckTaskFactory(
  definition: YAMLCheckDefinition,
  parentTask: ParentTask
) {
  async function yamlCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type, yamlPropertyPath } = definition;

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

    return new Promise<void>(async (resolve, reject) => {
      setTimeout(
        () => reject(`Check "${name}" timeout`),
        DEFAULT_CHECK_EXECUTION_TIMEOUT
      );

      let finishedCounter = 0;

      const errors: Error[] = [];
      const matches: ProjectCheckMatch[] = [];

      for (const file of files) {
        setTimeout(async () => {
          let data: any;
          let result: any;
          try {
            data = YAML.parse(fs.readFile(file), { strict: false });
            result = await jq.run(yamlPropertyPath, data, { input: 'json', output: 'json' })
          } catch (err: any) {
            const error = new Error(
              `[yaml] "${name}" - ${file} - ${err.message}`
            );
            errors.push(error);
            ctx.handledCheckFailures.push(error);
            finishedCounter++;
            if (finishedCounter === files.length) {
              resolve();
            }
            task.title = `${CheckResultSymbol.ERROR} ${task.title} - ${file} - ${err.message}`;
            resolveCheckParentTaskProgress(parentTask);
            return;
          }

          if (result?.length) {
            matches.push({
              file,
              matches: [
                {
                  match: yamlPropertyPath,
                  groups: {
                    [yamlPropertyPath]: result,
                  },
                },
              ],
            });
          }

          finishedCounter++;

          if (finishedCounter === files.length) {
            ctx.results.checks![name] = {
              name,
              type,
              value: matches.length > 0,
              matches,
            };

            task.title = errors.length
              ? errors.map((e) => e.message).join(',')
              : resolveCheckTaskFulfilledTitle(task, matches);
            resolveCheckParentTaskProgress(parentTask);

            resolve();
          }
        });
      }
    });
  }
  return yamlCheckTask;
}
