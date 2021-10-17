import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';
import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_CONTENT,
} from '../consts';
import {
  Context,
  JSONCheckDefinition,
  ProjectCheckMatchDetails,
} from '../interface';
import * as fs from '../services/fs.service';
import {
  CheckResultSymbol,
  getCheckFiles,
  resolveCheckTaskFulfilledTitle,
} from './check.service';

export function JSONCheckTaskFactory(definition: JSONCheckDefinition) {
  async function JSONCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type, propertyPath, value } = definition;

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

      for (const file of files) {
        let content = JSON.parse(fs.readFile(file));

        const propertyPathArr = propertyPath.split('.');

        let depth = 0;
        for (const property of propertyPathArr) {
          if (content.hasOwnProperty(property)) {
            content = content[property];
            depth++;
          }
        }

        let matches: ProjectCheckMatchDetails[];

        // We didn't found the leaf attribute
        if (depth !== propertyPathArr.length) {
          matches = [];
        } else {
          // Value is defined
          if (value || value === '') {
            // Content in the file is equal to the value defined
            if (content === value) {
              matches = [
                {
                  match: propertyPath,
                  groups: {
                    [propertyPathArr[propertyPathArr.length - 1]]: content,
                  },
                },
              ];
            } else {
              // Content in the file is NOT equal to the value defined
              matches = [];
            }
          } else {
            // Value was not defined -> We retrieve the content
            matches = [
              {
                match: propertyPath,
                groups: {
                  [propertyPathArr[propertyPathArr.length - 1]]: content,
                },
              },
            ];
          }
        }

        ctx.results.checks![file] = {
          name,
          type,
          value: !!matches.length,
          matches: [
            {
              file,
              matches,
            },
          ],
        };
        task.title = resolveCheckTaskFulfilledTitle(task, matches);
      }
      resolve();
    });
  }
  return JSONCheckTask;
}
