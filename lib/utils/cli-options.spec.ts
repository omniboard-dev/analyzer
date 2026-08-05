import yargs from 'yargs';
import { describe, expect, it } from 'vitest';

import { configureCliOptions } from './cli-options';

function parse(args: string[]) {
  return configureCliOptions(yargs(args).exitProcess(false))
    .option('feature', {
      type: 'boolean',
      default: false,
    })
    .parse();
}

describe('boolean CLI option contract', () => {
  it('uses the declared default when omitted', () => {
    expect(parse([]).feature).toBe(false);
  });

  it('treats option presence as true', () => {
    expect(parse(['--feature']).feature).toBe(true);
  });

  it('accepts an explicit false value', () => {
    expect(parse(['--feature', 'false']).feature).toBe(false);
  });

  it('rejects negated option names', () => {
    expect(() => parse(['--no-feature'])).toThrow('Unknown arguments');
  });
});
