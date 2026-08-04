import { CheckType, FileCheckDefinition } from '../../../interface';

import {
  CheckHandler,
  finalizeMatchCheck,
  getDefaultContentExcludePattern,
} from '../check-handler';

export const fileCheckHandler: CheckHandler<FileCheckDefinition> = {
  type: CheckType.FILE,
  hasExecutionTimeout: false,
  warningPriority: 0,
  getDefaultExcludePattern: getDefaultContentExcludePattern,
  prepare: () => undefined,
  evaluate: ({ resultPath, accumulator }) => {
    accumulator.matches.push({ file: resultPath, matches: [] });
  },
  finalize: ({ definition, accumulator }) =>
    finalizeMatchCheck(definition, accumulator, true),
};
