import * as fs from 'fs';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as p from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DirectoryReader,
  RoutedFile,
  SelectorGroup,
  WalkProjectCounters,
  walkProject,
} from './walk-project';

const testDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    testDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('walkProject', () => {
  it('routes files deterministically, propagates selector candidates and prunes excluded subtrees', async () => {
    const root = await createProject();
    const directoryReads: string[] = [];
    const progress: WalkProjectCounters[] = [];
    const selectorGroups: SelectorGroup[] = [
      {
        id: 'typescript',
        includeRegexp: /\.ts$/g,
        excludeRegexp: /^(node_modules|skip|pruned)(\/|$)/g,
        checkOrdinals: [2, 1, 2],
      },
      {
        id: 'html',
        includeRegexp: /\.html$/,
        excludeRegexp: /^pruned(\/|$)/,
        checkOrdinals: [3],
      },
      {
        id: 'typescript-outside-src',
        includeRegexp: /\.ts$/,
        excludeRegexp: /^(src|pruned)(\/|$)/,
        checkOrdinals: [4],
      },
    ];

    const directoryReader: DirectoryReader = async (absolutePath) => {
      directoryReads.push(p.relative(root, absolutePath).replace(/\\/g, '/'));
      return fs.promises.readdir(absolutePath, { withFileTypes: true });
    };

    const { files, counters } = await collectWalk(
      walkProject({
        root,
        selectorGroups,
        directoryReader,
        yieldEvery: 2,
        onProgress: (snapshot) => progress.push({ ...snapshot }),
      })
    );

    expect(files).toEqual([
      { path: 'a-root.ts', checkOrdinals: [1, 2, 4] },
      { path: 'b-root.html', checkOrdinals: [3] },
      { path: 'src/a.ts', checkOrdinals: [1, 2] },
      { path: 'src/b.html', checkOrdinals: [3] },
      { path: 'src/nested/c.ts', checkOrdinals: [1, 2] },
      { path: 'skip/x.ts', checkOrdinals: [4] },
      { path: 'node_modules/hidden.ts', checkOrdinals: [4] },
    ]);
    expect(directoryReads).toEqual([
      '',
      'src',
      'src/nested',
      'skip',
      'node_modules',
    ]);
    expect(directoryReads).not.toContain('pruned');
    expect(directoryReads).not.toContain('src-link');
    expect(counters).toMatchObject({
      directoriesVisited: 5,
      filesVisited: 7,
      eligibleFiles: 7,
      logicalCheckFileMatches: 11,
      symlinksIgnored: 1,
    });
    expect(progress.at(-1)).toEqual(counters);
    expect(selectorGroups[0].includeRegexp.lastIndex).toBe(0);
    expect(selectorGroups[0].excludeRegexp?.lastIndex).toBe(0);
  });

  it('does not read the root when there are no selectors', async () => {
    const root = await createTestDirectory();
    let readCount = 0;

    const { files, counters } = await collectWalk(
      walkProject({
        root,
        selectorGroups: [],
        directoryReader: async () => {
          readCount++;
          return [];
        },
      })
    );

    expect(files).toEqual([]);
    expect(readCount).toBe(0);
    expect(counters.directoriesVisited).toBe(0);
  });

  it('reports a directory read failure and completes the remaining walk', async () => {
    const root = await createTestDirectory();
    const error = new Error('directory unavailable');
    const failures: unknown[] = [];

    const { files, counters } = await collectWalk(
      walkProject({
        root,
        selectorGroups: [
          {
            id: 'typescript',
            includeRegexp: /\\.ts$/,
            checkOrdinals: [0],
          },
        ],
        directoryReader: async () => {
          throw error;
        },
        onDirectoryError: (failure) => failures.push(failure),
      })
    );

    expect(files).toEqual([]);
    expect(counters).toMatchObject({
      directoriesVisited: 1,
      directoryErrors: 1,
    });
    expect(failures).toEqual([
      {
        path: '.',
        error,
        checkOrdinals: [0],
      },
    ]);
  });

  it('cooperatively stops when its AbortSignal is aborted', async () => {
    const root = await createTestDirectory();
    await writeFile(p.join(root, 'a.ts'), '');
    await writeFile(p.join(root, 'b.ts'), '');
    const controller = new AbortController();
    const reason = new Error('stop walking');
    const iterator = walkProject({
      root,
      selectorGroups: [
        {
          id: 'typescript',
          includeRegexp: /\.ts$/,
          checkOrdinals: [0],
        },
      ],
      yieldEvery: 1,
      signal: controller.signal,
      onProgress: () => controller.abort(reason),
    });

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: { path: 'a.ts', checkOrdinals: [0] },
    });
    await expect(iterator.next()).rejects.toBe(reason);
  });
});

async function createProject(): Promise<string> {
  const root = await createTestDirectory();
  await Promise.all(
    ['node_modules', 'pruned', 'skip', 'src/nested'].map((directory) =>
      mkdir(p.join(root, directory), { recursive: true })
    )
  );
  await Promise.all(
    [
      ['a-root.ts', 'root'],
      ['b-root.html', 'root'],
      ['node_modules/hidden.ts', 'dependency'],
      ['pruned/never-read.ts', 'pruned'],
      ['skip/x.ts', 'skip'],
      ['src/a.ts', 'source'],
      ['src/b.html', 'template'],
      ['src/nested/c.ts', 'nested'],
    ].map(([path, content]) => writeFile(p.join(root, path), content))
  );
  await symlink(p.join(root, 'src'), p.join(root, 'src-link'));
  return root;
}

async function createTestDirectory(): Promise<string> {
  const directory = await mkdtemp(p.join(tmpdir(), 'analyzer-walker-'));
  testDirectories.push(directory);
  return directory;
}

async function collectWalk(
  iterator: AsyncGenerator<RoutedFile, WalkProjectCounters>
): Promise<{ files: RoutedFile[]; counters: WalkProjectCounters }> {
  const files: RoutedFile[] = [];

  while (true) {
    const result = await iterator.next();
    if (result.done) {
      return { files, counters: result.value };
    }
    files.push(result.value);
  }
}
