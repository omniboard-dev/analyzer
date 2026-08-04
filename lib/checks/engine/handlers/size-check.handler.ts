import { CheckType, SizeCheckDefinition } from '../../../interface';
import * as fs from '../../../services/fs.service';

import { CheckHandler, getDefaultSizeExcludePattern } from '../check-handler';

export const sizeCheckHandler: CheckHandler<SizeCheckDefinition> = {
  type: CheckType.SIZE,
  hasExecutionTimeout: false,
  warningPriority: 0,
  getDefaultExcludePattern: getDefaultSizeExcludePattern,
  prepare: () => undefined,
  evaluate: ({ resultPath, resource, accumulator, metrics }) => {
    metrics.statCalls++;
    const size = fs.getFileSize(resource.path);
    accumulator.sizeDetails.push({
      file: resultPath,
      size,
      sizeHumanReadable: fs.getHumanReadableFileSize(size),
    });
  },
  finalize: ({ definition, accumulator }) => {
    accumulator.sizeDetails.sort((left, right) => right.size - left.size);
    const total = accumulator.sizeDetails.reduce(
      (result, detail) => result + detail.size,
      0
    );
    return {
      name: definition.name,
      type: definition.type,
      value: accumulator.selectedFiles > 0,
      size: {
        total,
        totalHumanReadable: fs.getHumanReadableFileSize(total),
        details: accumulator.sizeDetails,
      },
    };
  },
};
