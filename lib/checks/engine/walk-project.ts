import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import * as p from 'path';
import { setImmediate as yieldToEventLoop } from 'timers/promises';

import { testRegExpStateless } from './regexp';

export interface SelectorGroup {
  id: string;
  includeRegexp: RegExp;
  excludeRegexp?: RegExp;
  checkOrdinals: readonly number[];
}

export interface RoutedFile {
  path: string;
  checkOrdinals: number[];
}

export interface WalkProjectCounters {
  directoriesVisited: number;
  directoryEntries: number;
  filesVisited: number;
  selectorTests: number;
  eligibleFiles: number;
  logicalCheckFileMatches: number;
  symlinksIgnored: number;
  otherEntriesIgnored: number;
  directoryErrors: number;
}

export interface WalkDirectoryError {
  path: string;
  error: unknown;
  checkOrdinals: number[];
}

export type DirectoryReader = (absolutePath: string) => Promise<Dirent[]>;

export interface WalkProjectOptions {
  root: string;
  selectorGroups: readonly SelectorGroup[];
  signal?: AbortSignal;
  onProgress?: (counters: Readonly<WalkProjectCounters>) => void;
  yieldEvery?: number;
  directoryReader?: DirectoryReader;
  onDirectoryError?: (failure: WalkDirectoryError) => void;
}

interface DirectoryFrame {
  absolutePath: string;
  relativePath: string;
  selectorGroups: readonly SelectorGroup[];
}

const DEFAULT_YIELD_EVERY = 1_024;

export async function* walkProject({
  root,
  selectorGroups,
  signal,
  onProgress,
  yieldEvery = DEFAULT_YIELD_EVERY,
  directoryReader = readDirectory,
  onDirectoryError,
}: WalkProjectOptions): AsyncGenerator<RoutedFile, WalkProjectCounters> {
  const counters = createCounters();

  if (!selectorGroups.length) {
    onProgress?.({ ...counters });
    return counters;
  }

  const normalizedYieldEvery = Math.max(1, Math.floor(yieldEvery));
  const stack: DirectoryFrame[] = [
    {
      absolutePath: p.resolve(root),
      relativePath: '',
      selectorGroups,
    },
  ];
  let entriesSinceYield = 0;

  while (stack.length) {
    throwIfAborted(signal);

    const currentDirectory = stack.pop()!;
    counters.directoriesVisited++;

    let entries: Dirent[];
    try {
      entries = await directoryReader(currentDirectory.absolutePath);
    } catch (error) {
      throwIfAborted(signal);
      counters.directoryErrors++;
      onDirectoryError?.({
        path: currentDirectory.relativePath || '.',
        error,
        checkOrdinals: Array.from(
          new Set(
            currentDirectory.selectorGroups.flatMap(
              ({ checkOrdinals }) => checkOrdinals
            )
          )
        ).sort((left, right) => left - right),
      });
      onProgress?.({ ...counters });
      continue;
    }
    throwIfAborted(signal);

    entries.sort(compareDirents);

    const childDirectories: DirectoryFrame[] = [];

    for (const entry of entries) {
      throwIfAborted(signal);

      counters.directoryEntries++;
      entriesSinceYield++;

      if (entry.isSymbolicLink()) {
        counters.symlinksIgnored++;
      } else if (entry.isDirectory()) {
        const relativePath = joinRelativePath(
          currentDirectory.relativePath,
          entry.name
        );
        const childSelectorGroups = currentDirectory.selectorGroups.filter(
          (selectorGroup) => !isExcluded(selectorGroup, relativePath, counters)
        );

        if (childSelectorGroups.length) {
          childDirectories.push({
            absolutePath: p.join(currentDirectory.absolutePath, entry.name),
            relativePath,
            selectorGroups: childSelectorGroups,
          });
        }
      } else if (entry.isFile()) {
        counters.filesVisited++;

        const relativePath = joinRelativePath(
          currentDirectory.relativePath,
          entry.name
        );
        const checkOrdinals = routeFile(
          relativePath,
          currentDirectory.selectorGroups,
          counters
        );

        if (checkOrdinals.length) {
          counters.eligibleFiles++;
          counters.logicalCheckFileMatches += checkOrdinals.length;
          yield { path: relativePath, checkOrdinals };
        }
      } else {
        counters.otherEntriesIgnored++;
      }

      if (entriesSinceYield >= normalizedYieldEvery) {
        entriesSinceYield = 0;
        onProgress?.({ ...counters });
        await yieldToEventLoop();
        throwIfAborted(signal);
      }
    }

    // Preserve the established analyzer result ordering. Directory entries are
    // ascending, then pushed onto a LIFO stack, so sibling directories are
    // visited in reverse lexical order while files stay ascending per folder.
    stack.push(...childDirectories);
  }

  onProgress?.({ ...counters });
  return counters;
}

function routeFile(
  path: string,
  selectorGroups: readonly SelectorGroup[],
  counters: WalkProjectCounters
): number[] {
  const checkOrdinals = new Set<number>();

  for (const selectorGroup of selectorGroups) {
    if (isExcluded(selectorGroup, path, counters)) {
      continue;
    }

    counters.selectorTests++;
    if (testRegExpStateless(selectorGroup.includeRegexp, path)) {
      selectorGroup.checkOrdinals.forEach((ordinal) =>
        checkOrdinals.add(ordinal)
      );
    }
  }

  return Array.from(checkOrdinals).sort((left, right) => left - right);
}

function isExcluded(
  selectorGroup: SelectorGroup,
  path: string,
  counters: WalkProjectCounters
): boolean {
  if (!selectorGroup.excludeRegexp) {
    return false;
  }

  counters.selectorTests++;
  return testRegExpStateless(selectorGroup.excludeRegexp, path);
}

function joinRelativePath(parent: string, child: string): string {
  return (parent ? `${parent}/${child}` : child).replace(/\\/g, '/');
}

function compareDirents(left: Dirent, right: Dirent): number {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

async function readDirectory(absolutePath: string): Promise<Dirent[]> {
  return readdir(absolutePath, { withFileTypes: true });
}

function createCounters(): WalkProjectCounters {
  return {
    directoriesVisited: 0,
    directoryEntries: 0,
    filesVisited: 0,
    selectorTests: 0,
    eligibleFiles: 0,
    logicalCheckFileMatches: 0,
    symlinksIgnored: 0,
    otherEntriesIgnored: 0,
    directoryErrors: 0,
  };
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return;
  }

  if (signal.reason instanceof Error) {
    throw signal.reason;
  }

  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  throw error;
}
