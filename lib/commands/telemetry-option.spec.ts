import yargs, { Argv } from 'yargs';
import { describe, expect, it } from 'vitest';

import { builder as batchBuilder } from '../batch/batch';
import { configureCliOptions } from '../utils/cli-options';

import { builder as analyzeBuilder } from './analyze';

const parseTelemetry = (builder: (yargs: Argv) => Argv, args: string[]) =>
  builder(configureCliOptions(yargs(args).exitProcess(false))).parse()
    .telemetry;

describe('telemetry CLI option', () => {
  it('defaults to false for analyze and true for batch', () => {
    expect(parseTelemetry(analyzeBuilder, [])).toBe(false);
    expect(parseTelemetry(batchBuilder, [])).toBe(true);
  });

  it.each([analyzeBuilder, batchBuilder])(
    'treats option presence as true',
    (builder) => {
      expect(parseTelemetry(builder, ['--telemetry'])).toBe(true);
    }
  );

  it.each([analyzeBuilder, batchBuilder])(
    'accepts an explicit false value',
    (builder) => {
      expect(parseTelemetry(builder, ['--telemetry', 'false'])).toBe(false);
    }
  );

  it.each([analyzeBuilder, batchBuilder])(
    'rejects --no-telemetry',
    (builder) => {
      expect(() => parseTelemetry(builder, ['--no-telemetry'])).toThrow(
        'Unknown arguments'
      );
    }
  );
});
