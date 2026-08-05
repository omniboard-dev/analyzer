import * as cp from 'child_process';
import * as p from 'path';
import { promisify } from 'util';

import { ProjectSize } from '../interface';

import { run } from './shell.service';

const execFile = promisify(cp.execFile);

export function getRepoNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1].replace(/\.git$/, '');
}

export async function cloneRepo(url: string, targetDir: string) {
  return await run(`git clone --depth 1 ${url}`, targetDir);
}

export async function pullLatest(targetDir: string) {
  return await run(`git checkout --force && git pull --depth 1`, targetDir);
}

export interface RemoteHead {
  ref?: string;
  sha: string;
}

export async function getRemoteHead(url: string): Promise<RemoteHead> {
  const { stdout } = await execFile(
    'git',
    ['ls-remote', '--symref', url, 'HEAD'],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    }
  );
  return parseRemoteHead(stdout);
}

export function parseRemoteHead(output: string): RemoteHead {
  const ref = /^ref:\s+(\S+)\s+HEAD$/m.exec(output)?.[1];
  const sha = /^([0-9a-f]{40,64})\s+HEAD$/im.exec(output)?.[1];
  if (!sha) {
    throw new Error('Remote HEAD revision could not be resolved');
  }
  return { ref, sha: sha.toLowerCase() };
}

export async function getCurrentCommit(
  targetDir: string = '.'
): Promise<string> {
  const { stdout } = await execFile('git', ['rev-parse', 'HEAD'], {
    cwd: targetDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim().toLowerCase();
}

export async function getCurrentBranch(
  targetDir: string = '.'
): Promise<string> {
  const { stdout } = await run(`git branch --show-current`, targetDir);
  return stdout.trim();
}

export function getProjectSizeFromTrackedFiles(
  filePaths: string[],
  linesByFile: Record<string, number> = {}
): ProjectSize {
  const byExtension: Record<string, number> = {};
  const linesByExtension: Record<string, number> = {};
  let totalLines = 0;

  filePaths.forEach((filePath) => {
    const extension =
      p.posix.extname(filePath).slice(1).toLowerCase() || '[none]';
    const lines = linesByFile[filePath] ?? 0;

    byExtension[extension] = (byExtension[extension] ?? 0) + 1;
    linesByExtension[extension] = (linesByExtension[extension] ?? 0) + lines;
    totalLines += lines;
  });

  return {
    totalFiles: filePaths.length,
    totalLines,
    byExtension,
    linesByExtension,
  };
}

export async function getTrackedProjectSize(
  targetDir: string = '.'
): Promise<ProjectSize> {
  const { stdout } = await execFile('git', ['ls-files', '--cached', '-z'], {
    cwd: targetDir,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
  });
  const trackedFiles = (stdout as Buffer)
    .toString('utf8')
    .split('\0')
    .filter(Boolean);

  return getProjectSizeFromTrackedFiles(
    trackedFiles,
    await countTrackedTextFileLines(targetDir)
  );
}

async function countTrackedTextFileLines(
  targetDir: string
): Promise<Record<string, number>> {
  let stdout: Buffer;

  try {
    const result = await execFile(
      'git',
      ['grep', '-I', '-c', '-z', '-e', '^', '--'],
      {
        cwd: targetDir,
        encoding: 'buffer',
        maxBuffer: 20 * 1024 * 1024,
      }
    );
    stdout = result.stdout as Buffer;
  } catch (error) {
    if (isNoGitGrepMatchesError(error)) {
      return {};
    }
    throw error;
  }

  return parseGitGrepLineCounts(stdout);
}

function isNoGitGrepMatchesError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 1
  );
}

function parseGitGrepLineCounts(output: Buffer): Record<string, number> {
  const entries: [string, number][] = [];
  let entryStart = 0;

  while (entryStart < output.length) {
    const separator = output.indexOf(0, entryStart);
    if (separator === -1) {
      throw new Error('Unexpected git grep output: missing path separator');
    }

    const entryEnd = output.indexOf(10, separator + 1);
    if (entryEnd === -1) {
      throw new Error('Unexpected git grep output: missing entry terminator');
    }

    const filePath = output.subarray(entryStart, separator).toString('utf8');
    const lineCountText = output
      .subarray(separator + 1, entryEnd)
      .toString('ascii');
    if (!/^\d+$/.test(lineCountText)) {
      throw new Error(
        'Unexpected git grep output: invalid line count for ' + filePath
      );
    }

    const lineCount = Number(lineCountText);
    if (!Number.isSafeInteger(lineCount)) {
      throw new Error(
        'Unexpected git grep output: unsafe line count for ' + filePath
      );
    }

    entries.push([filePath, lineCount]);
    entryStart = entryEnd + 1;
  }

  return Object.fromEntries(entries);
}
