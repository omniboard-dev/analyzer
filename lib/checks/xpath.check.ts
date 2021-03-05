import xpath from 'xpath';
import { ListrDefaultRenderer, ListrTaskWrapper } from 'listr2';

import * as fs from '../services/fs.service';
import {
  DEFAULT_CHECK_EXECUTION_TIMEOUT,
  DEFAULT_EXCLUDE_FILES_PATTERN_XPATH
} from '../consts';
import { XPathCheckDefinition, Context, ProjectCheckMatch } from '../interface';

import { getCheckFiles } from './check.service';

export function xpathCheckTaskFactory(definition: XPathCheckDefinition) {
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
        const document = fs.readXmlAsDom(file);
        const namespaces =
          definition.xpathNamespaces?.reduce(
            (result, { prefix, uri }) => ({ ...result, [prefix]: uri }),
            {}
          ) ?? {};
        const xpathSelect = xpath.useNamespaces(namespaces);

        const result: any = xpathSelect(definition.xpathExpression, document);

        if (typeof result === 'object') {
          matches.push({
            file,
            matches: Array.from(result as any[]).map(node => ({
              match: node.localName,
              groups: {
                value: node?.firstChild?.nodeValue
              }
            }))
          });
        } else {
          matches.push({
            file,
            matches: [{ match: result, groups: {} }]
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
  return xpathCheckTask;
}
