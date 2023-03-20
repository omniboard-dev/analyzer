import xpath from 'xpath';
import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import * as fs from '../services/fs.service';
import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_XPATH,
} from '../consts';
import {
  XPathCheckDefinition,
  Context,
  ProjectCheckMatch,
  ParentTask,
} from '../interface';

import {
  CheckResultSymbol,
  getCheckFiles,
  resolveCheckParentTaskProgress,
  resolveCheckTaskFulfilledTitle,
} from './check.service';

export function xpathCheckTaskFactory(
  definition: XPathCheckDefinition,
  parentTask: ParentTask
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
        const document = fs.readXmlAsDom(file, {
          xpathSanitizeAngularTemplate: definition.xpathSanitizeAngularTemplate,
          verbose: ctx.options.verbose,
        });
        const namespaces =
          definition.xpathNamespaces?.reduce(
            (result, { prefix, uri }) => ({ ...result, [prefix]: uri }),
            {}
          ) ?? {};
        const xpathSelect = xpath.useNamespaces(namespaces);

        const result: any = xpathSelect(definition.xpathExpression, document);
        const resultMatches: any[] = [];

        if (typeof result === 'object' && Array.from(result as any[])?.length) {
          for (const node of Array.from(result as any[])) {
            const value =
              node?.nodeValue?.toString()?.trim() ||
              node?.textContent?.toString()?.trim();
            if (!!value) {
              const property =
                node.nodeName === '#text'
                  ? node?.parentNode?.nodeName ?? node.nodeName
                  : node.nodeName;
              resultMatches.push({
                match: resolveNodePath(node),
                lineNumber: node?.lineNumber,
                columnNumber: node?.columnNumber,
                groups: {
                  [property]: value,
                },
              });
            }
          }

          if (resultMatches.length) {
            matches.push({
              file,
              matches: resultMatches,
            });
          }
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
  return xpathCheckTask;
}

function resolveNodePath(originalNode: any) {
  let currentNode = originalNode;
  let path = originalNode.nodeName;
  while (
    (currentNode?.parentNode &&
      currentNode?.parentNode?.nodeName !== '#document') ||
    currentNode?.ownerElement
  ) {
    currentNode = currentNode?.parentNode ?? currentNode?.ownerElement;
    path = `${currentNode.nodeName} > ${path}`;
  }
  return path;
}
