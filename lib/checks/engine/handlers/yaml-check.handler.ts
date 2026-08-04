import { CheckType, YAMLCheckDefinition } from '../../../interface';
import { readYamlPath } from '../../yaml-path';

import {
  CheckHandler,
  finalizeMatchCheck,
  getDefaultContentExcludePattern,
  resolveErrorMessage,
} from '../check-handler';

export const yamlCheckHandler: CheckHandler<YAMLCheckDefinition> = {
  type: CheckType.YAML,
  hasExecutionTimeout: true,
  warningPriority: 1,
  getDefaultExcludePattern: getDefaultContentExcludePattern,
  prepare: () => undefined,
  evaluate: ({ definition, resultPath, resource, accumulator }) => {
    const result = readYamlPath(
      resource.readYaml(),
      definition.yamlPropertyPath
    );

    if (result.length) {
      accumulator.matches.push({
        file: resultPath,
        matches: [
          {
            match: definition.yamlPropertyPath,
            groups: {
              [definition.yamlPropertyPath]: result,
            },
          },
        ],
      });
    }
  },
  finalize: ({ definition, accumulator }) =>
    finalizeMatchCheck(definition, accumulator),
  formatFileError: (definition, file, error) =>
    new Error(
      `[yaml] "${definition.name}" - ${file} - ${resolveErrorMessage(error)}`
    ),
};
