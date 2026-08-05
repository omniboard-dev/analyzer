import { describe, expect, it } from 'vitest';

import { Context } from '../../../interface';

import {
  createAnalysisCacheEntry,
  normalizeRepositoryIdentity,
  withAnalysisCacheHead,
} from '../planning/fingerprint';

describe('analysis cache fingerprint', () => {
  it('normalizes HTTPS and SCP repository URLs to the same identity', () => {
    expect(
      normalizeRepositoryIdentity(
        'https://token@gitlab.example.com/group/project.git'
      )
    ).toBe('gitlab.example.com/group/project');
    expect(
      normalizeRepositoryIdentity('git@gitlab.example.com:group/project.git')
    ).toBe('gitlab.example.com/group/project');
  });

  it('is stable across object key ordering', () => {
    const left = createAnalysisCacheEntry(
      'https://gitlab.example.com/group/project.git',
      { ref: 'refs/heads/main', sha: 'a'.repeat(40) },
      context({ alpha: 1, beta: 2 })
    );
    const right = createAnalysisCacheEntry(
      'https://gitlab.example.com/group/project.git',
      { ref: 'refs/heads/main', sha: 'a'.repeat(40) },
      context({ beta: 2, alpha: 1 })
    );

    expect(left.fingerprint).toBe(right.fingerprint);
  });

  it('changes the fingerprint when the default branch changes', () => {
    const main = createAnalysisCacheEntry(
      'https://gitlab.example.com/group/project.git',
      { ref: 'refs/heads/main', sha: 'a'.repeat(40) },
      context({})
    );
    const master = createAnalysisCacheEntry(
      'https://gitlab.example.com/group/project.git',
      { ref: 'refs/heads/master', sha: 'a'.repeat(40) },
      context({})
    );

    expect(main.fingerprint).not.toBe(master.fingerprint);
  });

  it('changes the fingerprint when the analyzed commit changes', () => {
    const original = createAnalysisCacheEntry(
      'https://gitlab.example.com/group/project.git',
      { ref: 'refs/heads/main', sha: 'a'.repeat(40) },
      context({})
    );
    const changed = withAnalysisCacheHead(original, 'b'.repeat(40));

    expect(changed.fingerprint).not.toBe(original.fingerprint);
    expect(changed.headSha).toBe('b'.repeat(40));
  });
});

function context(settings: Record<string, unknown>): Context {
  return {
    options: {
      errorsAsWarnings: false,
      sanitizeRepoUrl: true,
    },
    settings,
    definitions: {
      checks: [
        {
          name: 'check',
          type: 'file',
          disabled: false,
          filesPattern: 'package.json',
        },
      ],
    },
  } as Context;
}
