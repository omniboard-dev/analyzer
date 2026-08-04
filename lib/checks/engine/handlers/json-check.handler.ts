import { JSONPath } from 'jsonpath-plus';

import { CheckType, JSONCheckDefinition } from '../../../interface';

import {
  CheckHandler,
  finalizeMatchCheck,
  getDefaultContentExcludePattern,
} from '../check-handler';

export const jsonCheckHandler: CheckHandler<JSONCheckDefinition> = {
  type: CheckType.JSON,
  hasExecutionTimeout: true,
  warningPriority: 1,
  getDefaultExcludePattern: getDefaultContentExcludePattern,
  prepare: () => undefined,
  evaluate: ({ definition, resultPath, resource, accumulator }) => {
    const path = definition.jsonPropertyPath?.startsWith('$')
      ? definition.jsonPropertyPath
      : `$${definition.jsonPropertyPath}`;
    const result = JSONPath({ path, json: resource.readJson() });

    if (result?.length) {
      accumulator.matches.push({
        file: resultPath,
        matches: result.map((value: any) => ({
          match: definition.jsonPropertyPath,
          groups: {
            [definition.jsonPropertyPath]: value,
          },
        })),
      });
    }
  },
  finalize: ({ definition, accumulator }) =>
    finalizeMatchCheck(definition, accumulator),
};
