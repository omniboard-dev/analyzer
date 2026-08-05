import yargs, { Argv } from 'yargs';
import { describe, expect, it } from 'vitest';

import { configureCliOptions } from '../../../utils/cli-options';
import { builder } from '../../batch';

const parseSkipUnchanged = (args: string[]) =>
  builder(configureCliOptions(yargs(args).exitProcess(false) as Argv)).parse()
    .skipUnchanged;

describe('skip-unchanged CLI option', () => {
  it('defaults to true for batch', () => {
    expect(parseSkipUnchanged([])).toBe(true);
  });

  it('treats option presence as true', () => {
    expect(parseSkipUnchanged(['--skip-unchanged'])).toBe(true);
  });

  it('accepts an explicit false value', () => {
    expect(parseSkipUnchanged(['--skip-unchanged', 'false'])).toBe(false);
  });

  it('rejects --no-skip-unchanged', () => {
    expect(() => parseSkipUnchanged(['--no-skip-unchanged'])).toThrow(
      'Unknown arguments'
    );
  });
});
