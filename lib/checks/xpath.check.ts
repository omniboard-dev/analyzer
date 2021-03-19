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
        const document = fs.readXmlAsDom(file);
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

const a = [
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 4,
      columnNumber: 117,
      nodeValue: '\n      B2cCurrencyPipe create an instance\n    '
    },
    match: '#text',
    groups: { value: '\n      B2cCurrencyPipe create an instance\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 11,
      columnNumber: 121,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 23,
      columnNumber: 127,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 27,
      columnNumber: 101,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 31,
      columnNumber: 111,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 35,
      columnNumber: 117,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 39,
      columnNumber: 108,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 43,
      columnNumber: 119,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 47,
      columnNumber: 113,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 51,
      columnNumber: 121,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 55,
      columnNumber: 207,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 69,
      columnNumber: 189,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 75,
      columnNumber: 111,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 79,
      columnNumber: 109,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 83,
      columnNumber: 131,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 87,
      columnNumber: 117,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 91,
      columnNumber: 113,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 95,
      columnNumber: 118,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 105,
      columnNumber: 129,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 109,
      columnNumber: 139,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 123,
      columnNumber: 115,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 127,
      columnNumber: 113,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 131,
      columnNumber: 128,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 135,
      columnNumber: 275,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 155,
      columnNumber: 115,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 159,
      columnNumber: 129,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 163,
      columnNumber: 147,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 171,
      columnNumber: 195,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 183,
      columnNumber: 109,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 197,
      columnNumber: 133,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 201,
      columnNumber: 117,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 209,
      columnNumber: 195,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 219,
      columnNumber: 117,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 223,
      columnNumber: 119,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 233,
      columnNumber: 116,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 237,
      columnNumber: 111,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 241,
      columnNumber: 127,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  },
  {
    node: {
      nodeName: '#text',
      namespaceURI: null,
      localName: null,
      lineNumber: 245,
      columnNumber: 117,
      nodeValue: '\n    '
    },
    match: '#text',
    groups: { value: '\n    ' }
  }
];
