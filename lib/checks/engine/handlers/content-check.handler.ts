import {
  CheckType,
  ContentCheckDefinition,
  ProjectCheckMatchDetails,
} from '../../../interface';
import { resolveActiveFlags } from '../../../utils/regexp';

import {
  CheckHandler,
  finalizeMatchCheck,
  getDefaultContentExcludePattern,
} from '../check-handler';

const DEFAULT_CONTENT_PATTERN_FLAGS = 'ig';

export const contentCheckHandler: CheckHandler<ContentCheckDefinition, RegExp> =
  {
    type: CheckType.CONTENT,
    hasExecutionTimeout: true,
    warningPriority: 0,
    getDefaultExcludePattern: getDefaultContentExcludePattern,
    prepare: (definition) =>
      new RegExp(
        definition.contentPattern,
        resolveActiveFlags(
          definition.contentPatternFlags,
          DEFAULT_CONTENT_PATTERN_FLAGS
        )
      ),
    evaluate: ({ prepared: regexp, resultPath, resource, accumulator }) => {
      const content = resource.readText();
      const matchesForFile: RegExpExecArray[] = [];
      regexp.lastIndex = 0;

      if (regexp.global) {
        let match: RegExpExecArray | null;
        while ((match = regexp.exec(content)) !== null) {
          matchesForFile.push(match);
          if (match[0] === '') {
            regexp.lastIndex = advanceStringIndex(
              content,
              regexp.lastIndex,
              regexp.unicode
            );
          }
        }
      } else {
        const match = regexp.exec(content);
        if (match) {
          matchesForFile.push(match);
        }
      }
      regexp.lastIndex = 0;

      if (matchesForFile.length) {
        accumulator.matches.push({
          file: resultPath,
          matches: matchesForFile.map(
            (match) =>
              ({
                match: match[0],
                groups: match.groups,
              } as ProjectCheckMatchDetails)
          ),
        });
      }
    },
    finalize: ({ definition, accumulator }) =>
      finalizeMatchCheck(definition, accumulator),
  };

function advanceStringIndex(
  value: string,
  index: number,
  unicode: boolean
): number {
  if (!unicode || index >= value.length) {
    return index + 1;
  }

  const first = value.charCodeAt(index);
  if (first < 0xd800 || first > 0xdbff || index + 1 >= value.length) {
    return index + 1;
  }

  const second = value.charCodeAt(index + 1);
  return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}
