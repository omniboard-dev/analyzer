import yargs, { Argv } from 'yargs';
import { describe, expect, it } from 'vitest';

import { builder as batchBuilder } from '../batch/batch';
import { configureCliOptions } from '../utils/cli-options';

import { builder as analyzeBuilder } from './analyze';

const parseSanitizeRepoUrl = (builder: (yargs: Argv) => Argv, args: string[]) =>
  builder(configureCliOptions(yargs(args).exitProcess(false))).parse()
    .sanitizeRepoUrl;

describe('sanitize-repo-url CLI option', () => {
  it.each([analyzeBuilder, batchBuilder])('defaults to true', (builder) => {
    expect(parseSanitizeRepoUrl(builder, [])).toBe(true);
  });

  it.each([analyzeBuilder, batchBuilder])(
    'accepts an explicit false value',
    (builder) => {
      expect(
        parseSanitizeRepoUrl(builder, ['--sanitize-repo-url', 'false'])
      ).toBe(false);
    }
  );

  it.each([analyzeBuilder, batchBuilder])(
    'accepts the short alias',
    (builder) => {
      expect(parseSanitizeRepoUrl(builder, ['--sru', 'false'])).toBe(false);
    }
  );
});
