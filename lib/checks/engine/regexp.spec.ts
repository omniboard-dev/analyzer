import { describe, expect, it } from 'vitest';

import { getRegExpKey, testRegExpStateless } from './regexp';

describe('testRegExpStateless', () => {
  it('resets a global regular expression before and after every test', () => {
    const regexp = /\.ts$/g;
    regexp.lastIndex = 4;

    expect(testRegExpStateless(regexp, 'src/app.ts')).toBe(true);
    expect(regexp.lastIndex).toBe(0);
    expect(testRegExpStateless(regexp, 'src/other.ts')).toBe(true);
    expect(regexp.lastIndex).toBe(0);
  });

  it('returns a stable key from source and flags', () => {
    expect(getRegExpKey(/\.ts$/gi)).toBe('\\.ts$/gi');
    expect(getRegExpKey()).toBe('');
  });
});
