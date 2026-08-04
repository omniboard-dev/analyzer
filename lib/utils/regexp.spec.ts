import { describe, expect, it } from 'vitest';

import { execRegExpAll } from './regexp';

describe('execRegExpAll', () => {
  it('returns one match for a non-global expression instead of looping', () => {
    const regexp = /team: (?<team>\w+)/i;

    expect(
      execRegExpAll(regexp, 'team: Alpha\nteam: Beta').map(
        (match) => match.groups?.team
      )
    ).toEqual(['Alpha']);
    expect(regexp.lastIndex).toBe(0);
  });

  it('returns every global match and resets state', () => {
    const regexp = /team: (?<team>\w+)/gi;

    expect(
      execRegExpAll(regexp, 'team: Alpha\nteam: Beta').map(
        (match) => match.groups?.team
      )
    ).toEqual(['Alpha', 'Beta']);
    expect(regexp.lastIndex).toBe(0);
  });

  it('advances global zero-width expressions safely', () => {
    const regexp = /(?<team>(?=a))/g;

    expect(execRegExpAll(regexp, 'aa')).toHaveLength(2);
    expect(regexp.lastIndex).toBe(0);
  });
});
