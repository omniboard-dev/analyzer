import { describe, expect, it } from 'vitest';

import { readYamlPath } from './yaml-path';

describe('readYamlPath', () => {
  const data = {
    components: [
      {
        metadata: {
          annotations: {
            domain: 'customer',
          },
          labels: {
            availability: 'high',
          },
        },
      },
    ],
  };

  it('resolves the YAML paths used by project checks', () => {
    expect(
      readYamlPath(data, '.components[0].metadata.annotations.domain')
    ).toEqual(['customer']);
    expect(
      readYamlPath(data, '.components[0].metadata.labels.availability')
    ).toEqual(['high']);
  });

  it('supports optional root prefix and bracket quoted properties', () => {
    expect(
      readYamlPath(data, '$.components[0]["metadata"].annotations.domain')
    ).toEqual(['customer']);
  });

  it('supports array and object wildcards', () => {
    expect(readYamlPath(data, '.components[*].metadata.labels.*')).toEqual([
      'high',
    ]);
  });

  it('returns an empty array for missing values', () => {
    expect(
      readYamlPath(data, '.components[1].metadata.annotations.domain')
    ).toEqual([]);
    expect(readYamlPath(data, '.components[0].metadata.owner')).toEqual([]);
  });

  it('rejects unsupported jq-only syntax', () => {
    expect(() => readYamlPath(data, '.components[0] // "fallback"')).toThrow(
      /Unsupported YAML path syntax/
    );
    expect(() =>
      readYamlPath(data, '.components[0].metadata | .labels')
    ).toThrow(/Unsupported YAML path syntax/);
    expect(() => readYamlPath(data, '..metadata.labels')).toThrow(
      /Unsupported YAML path syntax/
    );
  });
});
