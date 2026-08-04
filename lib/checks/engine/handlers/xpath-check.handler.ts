import xpath from 'xpath';

import { CheckType, XPathCheckDefinition } from '../../../interface';

import {
  CheckHandler,
  finalizeMatchCheck,
  getDefaultXpathExcludePattern,
} from '../check-handler';

export const xpathCheckHandler: CheckHandler<XPathCheckDefinition> = {
  type: CheckType.XPATH,
  hasExecutionTimeout: true,
  warningPriority: 0,
  getDefaultExcludePattern: getDefaultXpathExcludePattern,
  prepare: () => undefined,
  evaluate: ({ definition, resultPath, resource, accumulator }) => {
    const document = resource.readDom(
      Boolean(definition.xpathSanitizeAngularTemplate)
    );
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
        if (value) {
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
    }

    if (resultMatches.length) {
      accumulator.matches.push({
        file: resultPath,
        matches: resultMatches,
      });
    }
  },
  finalize: ({ definition, accumulator }) =>
    finalizeMatchCheck(definition, accumulator),
};

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
