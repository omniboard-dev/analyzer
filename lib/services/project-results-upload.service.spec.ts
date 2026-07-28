import { describe, expect, it } from 'vitest';

import { ProjectCheck } from '../interface';

import { prepareProjectResultsForUpload } from './project-results-upload.service';

function createCheck(name: string, contentLength = 0): ProjectCheck {
  return {
    name,
    type: 'content',
    value: true,
    matches: [
      {
        file: `${name}.ts`,
        matches: [
          {
            match: 'x'.repeat(contentLength),
            groups: {},
          },
        ],
      },
    ],
  };
}

describe('prepareProjectResultsForUpload', () => {
  it('preserves results within the configured limits', () => {
    const original = {
      name: 'demo',
      checks: {
        small: createCheck('small', 10),
      },
    };

    const prepared = prepareProjectResultsForUpload(original, {
      checkResultSizeLimit: 1,
      totalCheckResultSizeLimit: 2,
    });

    expect(prepared.rejectedCheckResults).toEqual([]);
    expect(prepared.results).toEqual(original);
    expect(prepared.results).not.toBe(original);
    expect(prepared.results.checks).not.toBe(original.checks);
  });

  it('preserves a result exactly at the per-check limit', () => {
    const check = createCheck('equal');
    const emptyMatchSize = Buffer.byteLength(JSON.stringify(check), 'utf8');
    check.matches![0].matches[0].match = 'x'.repeat(1024 - emptyMatchSize);

    expect(Buffer.byteLength(JSON.stringify(check), 'utf8')).toBe(1024);

    const prepared = prepareProjectResultsForUpload(
      { checks: { equal: check } },
      {
        checkResultSizeLimit: 1,
        totalCheckResultSizeLimit: 2,
      }
    );

    expect(prepared.rejectedCheckResults).toEqual([]);
    expect(prepared.results.checks).toHaveProperty('equal');
  });

  it('rejects a result above the per-check limit', () => {
    const prepared = prepareProjectResultsForUpload(
      {
        checks: {
          small: createCheck('small', 10),
          huge: createCheck('huge', 2_000),
        },
      },
      {
        checkResultSizeLimit: 1,
        totalCheckResultSizeLimit: 10,
      }
    );

    expect(prepared.results.checks).toHaveProperty('small');
    expect(prepared.results.checks).not.toHaveProperty('huge');
    expect(prepared.rejectedCheckResults).toEqual([
      expect.objectContaining({
        name: 'huge',
        limit: 1024,
        reason: 'per-check',
      }),
    ]);
  });

  it('rejects the largest results first to satisfy the total limit', () => {
    const prepared = prepareProjectResultsForUpload(
      {
        checks: {
          medium: createCheck('medium', 500),
          largest: createCheck('largest', 700),
          small: createCheck('small', 100),
        },
      },
      {
        checkResultSizeLimit: 2,
        totalCheckResultSizeLimit: 1,
      }
    );

    expect(prepared.results.checks).toHaveProperty('medium');
    expect(prepared.results.checks).toHaveProperty('small');
    expect(prepared.results.checks).not.toHaveProperty('largest');
    expect(prepared.rejectedCheckResults).toEqual([
      expect.objectContaining({
        name: 'largest',
        limit: 1024,
        reason: 'total',
      }),
    ]);
  });

  it('does not apply limits that were not provided', () => {
    const prepared = prepareProjectResultsForUpload(
      {
        checks: {
          huge: createCheck('huge', 2_000),
        },
      },
      {}
    );

    expect(prepared.rejectedCheckResults).toEqual([]);
    expect(prepared.results.checks).toHaveProperty('huge');
  });
});
