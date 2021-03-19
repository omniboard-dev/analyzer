import xpath from 'xpath';
import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import * as fs from '../services/fs.service';
import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_XPATH
} from '../consts';
import { XPathCheckDefinition, Context, ProjectCheckMatch } from '../interface';

import {
  CheckResultSymbol,
  getCheckFiles,
  resolveCheckTaskFulfilledTitle
} from './check.service';

export function xpathCheckTaskFactory(
  definition: XPathCheckDefinition,
  ctx: Context
) {
  async function xpathCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const { name, type } = definition;
    const files = getCheckFiles(
      definition,
      DEFAULT_EXCLUDE_FILES_PATTERN_XPATH
    );

    task.title = `${task.title}, found ${files.length} files`;

    if (!files.length) {
      ctx.results.checks![name] = {
        name,
        type,
        value: false
      };
      task.title = `${CheckResultSymbol.UNFULFILLED} ${task.title}`;
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
        const document = fs.readXmlAsDom(file, {
          xpathSanitizeAngularTemplate: definition.xpathSanitizeAngularTemplate,
          verbose: ctx.options.verbose
        });
        const namespaces =
          definition.xpathNamespaces?.reduce(
            (result, { prefix, uri }) => ({ ...result, [prefix]: uri }),
            {}
          ) ?? {};
        const xpathSelect = xpath.useNamespaces(namespaces);

        const result: any = xpathSelect(definition.xpathExpression, document);

        if (typeof result === 'object' && Array.from(result as any[])?.length) {
          const resultMatches = Array.from(result as any[])
            .filter(node => !!node?.nodeValue?.toString()?.trim())
            .map(node => ({
              match: node.nodeName,
              lineNumber: node?.lineNumber,
              columnNumber: node?.columnNumber,
              groups: {
                value: node?.nodeValue?.toString()?.trim()
              }
            }));
          if (resultMatches.length) {
            matches.push({
              file,
              matches: resultMatches
            });
          }
        }
        finishedCounter++;
        if (finishedCounter >= files.length) {
          ctx.results.checks![name] = {
            name,
            type,
            value: matches.length > 0,
            matches
          };
          task.title = resolveCheckTaskFulfilledTitle(task, matches);
          resolve();
        }
      }
    });
  }
  return xpathCheckTask;
}
