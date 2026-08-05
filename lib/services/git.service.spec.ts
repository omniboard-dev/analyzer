import * as cp from 'child_process';
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  getProjectSizeFromTrackedFiles,
  getTrackedProjectSize,
  parseRemoteHead,
} from './git.service';

describe('parseRemoteHead', () => {
  it('parses the symbolic default branch and revision', () => {
    expect(
      parseRemoteHead(
        'ref: refs/heads/main\tHEAD\nABCDEF1234567890ABCDEF1234567890ABCDEF12\tHEAD\n'
      )
    ).toEqual({
      ref: 'refs/heads/main',
      sha: 'abcdef1234567890abcdef1234567890abcdef12',
    });
  });

  it('rejects a remote without a HEAD revision', () => {
    expect(() => parseRemoteHead('')).toThrow(
      'Remote HEAD revision could not be resolved'
    );
  });
});

describe('getProjectSizeFromTrackedFiles', () => {
  it('counts tracked files by normalized extension', () => {
    expect(
      getProjectSizeFromTrackedFiles([
        'apps/app/main.TS',
        'apps/app/app.component.ts',
        'README',
        '.github/workflows/ci.yml',
      ])
    ).toEqual({
      totalFiles: 4,
      totalLines: 0,
      byExtension: {
        ts: 2,
        '[none]': 1,
        yml: 1,
      },
      linesByExtension: {
        ts: 0,
        '[none]': 0,
        yml: 0,
      },
    });
  });
});

describe('getTrackedProjectSize', () => {
  let targetDir: string | undefined;

  afterEach(() => {
    if (targetDir) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      targetDir = undefined;
    }
  });

  function createTrackedRepository(
    files: Record<string, string | Buffer>
  ): string {
    targetDir = fs.mkdtempSync(p.join(tmpdir(), 'omniboard-analyzer-git-'));
    cp.execFileSync('git', ['init', '--quiet'], { cwd: targetDir });

    Object.entries(files).forEach(([filePath, contents]) => {
      const absolutePath = p.join(targetDir!, filePath);
      fs.mkdirSync(p.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, contents);
    });
    cp.execFileSync('git', ['add', '--all'], { cwd: targetDir });

    return targetDir;
  }

  it('counts tracked text lines and skips binary and untracked files', async () => {
    const repository = createTrackedRepository({
      README: 'first\nsecond\n',
      'asset.bin': Buffer.from([0, 10, 0]),
      'empty.md': '',
      'src/main.ts': 'const first = 1;\n\nconst second = 2;',
    });
    fs.writeFileSync(p.join(repository, 'untracked.ts'), 'untracked\n');

    await expect(getTrackedProjectSize(repository)).resolves.toEqual({
      totalFiles: 4,
      totalLines: 5,
      byExtension: {
        '[none]': 1,
        bin: 1,
        md: 1,
        ts: 1,
      },
      linesByExtension: {
        '[none]': 2,
        bin: 0,
        md: 0,
        ts: 3,
      },
    });
  });

  it('returns zero lines when every tracked file is empty or binary', async () => {
    const repository = createTrackedRepository({
      'asset.bin': Buffer.from([0, 10, 0]),
      'empty.md': '',
    });

    await expect(getTrackedProjectSize(repository)).resolves.toEqual({
      totalFiles: 2,
      totalLines: 0,
      byExtension: {
        bin: 1,
        md: 1,
      },
      linesByExtension: {
        bin: 0,
        md: 0,
      },
    });
  });
});
