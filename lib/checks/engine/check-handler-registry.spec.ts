import { describe, expect, it } from 'vitest';

import { CheckType } from '../../interface';

import { getCheckHandler, getCheckHandlers } from './check-handler-registry';

const executableCheckTypes = [
  CheckType.CONTENT,
  CheckType.FILE,
  CheckType.JSON,
  CheckType.SIZE,
  CheckType.XPATH,
  CheckType.YAML,
];

describe('check handler registry', () => {
  it('registers exactly one handler for every executable check type', () => {
    const handlers = getCheckHandlers();

    expect(handlers.map(({ type }) => type)).toEqual(executableCheckTypes);
    expect(new Set(handlers.map(({ type }) => type))).toHaveLength(
      executableCheckTypes.length
    );
    executableCheckTypes.forEach((type) => {
      expect(getCheckHandler(type)?.type).toBe(type);
    });
  });

  it('keeps metadata checks outside file execution', () => {
    expect(getCheckHandler(CheckType.META)).toBeUndefined();
  });

  it('preserves timeout and warning ordering policies', () => {
    expect(
      Object.fromEntries(
        getCheckHandlers().map(
          ({ type, hasExecutionTimeout, warningPriority }) => [
            type,
            { hasExecutionTimeout, warningPriority },
          ]
        )
      )
    ).toEqual({
      [CheckType.CONTENT]: {
        hasExecutionTimeout: true,
        warningPriority: 0,
      },
      [CheckType.FILE]: {
        hasExecutionTimeout: false,
        warningPriority: 0,
      },
      [CheckType.JSON]: {
        hasExecutionTimeout: true,
        warningPriority: 1,
      },
      [CheckType.SIZE]: {
        hasExecutionTimeout: false,
        warningPriority: 0,
      },
      [CheckType.XPATH]: {
        hasExecutionTimeout: true,
        warningPriority: 0,
      },
      [CheckType.YAML]: {
        hasExecutionTimeout: true,
        warningPriority: 1,
      },
    });
  });
});
