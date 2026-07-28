import * as fs from 'fs';
import * as p from 'path';
import filesize from 'filesize';
import { DOMParser } from '@xmldom/xmldom';

const REGEXP_MATCH_NOTHING = /a^/;

export function currentFolderName(): string {
  return p.basename(p.resolve(process.cwd()));
}

export function findFiles(
  includePattern: string,
  includeFlags?: string,
  excludePattern?: string,
  excludeFlags?: string
) {
  const results = [];
  const stack = ['.'];

  const includeRegexp = new RegExp(includePattern, includeFlags);
  const excludeRegexp = excludePattern
    ? new RegExp(excludePattern, excludeFlags)
    : REGEXP_MATCH_NOTHING;

  while (stack.length > 0) {
    const currentPath = stack.pop() as string;
    const paths = fs
      .readdirSync(currentPath)
      .map((nextPath) => p.join(currentPath, nextPath));
    const dirs = paths.filter(
      (nextPath) =>
        !excludeRegexp.test(nextPath) && fs.lstatSync(nextPath).isDirectory()
    );
    const files = paths.filter(
      (nextPath) =>
        !excludeRegexp.test(nextPath) &&
        fs.lstatSync(nextPath).isFile() &&
        includeRegexp.test(nextPath.replace(/\\/g, '/'))
    );
    results.push(...files);
    stack.push(...dirs);
  }
  return results;
}

export function readJson(path: string) {
  try {
    const buffer = fs.readFileSync(path);
    return JSON.parse(buffer.toString());
  } catch (err) {
    return undefined;
  }
}

export function readXmlAsDom(
  path: string,
  options: { xpathSanitizeAngularTemplate?: boolean; verbose?: boolean } = {}
): any {
  const buffer = fs.readFileSync(path);
  const content =
    (options.xpathSanitizeAngularTemplate
      ? buffer?.toString()?.replace(/(\*|\(|\)|\[|\]|\#|\@|\.)/gi, '')
      : buffer?.toString()) ?? '';
  return new DOMParser({
    locator: true,
    onError(level, message) {
      if (level === 'warning') {
        if (options.verbose) {
          console.warn(message);
        }
      } else if (level === 'error') {
        if (options.verbose) {
          console.error(message);
        }
      } else {
        console.error(message);
      }
    },
  }).parseFromString(content, 'text/xml') as any;
}

export function writeJson(destinationPath: string, data: any) {
  const { dir } = p.parse(destinationPath);
  const dataAsString = JSON.stringify(data, null, 2);
  if (dir) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(destinationPath, dataAsString);
}

export function readFile(path: string) {
  const buffer = fs.readFileSync(path);
  return buffer.toString();
}

export function getFileSize(path: string) {
  return fs.statSync(path).size;
}

export function getHumanReadableFileSize(size: number) {
  return filesize(size);
}

export function ensureDirectoryExists(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export function directoryExists(path: string) {
  return fs.existsSync(path);
}

export function pathJoin(...parts: string[]) {
  return p.join(...parts);
}

export function removeDirectoryRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const filePath = p.join(path, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        removeDirectoryRecursive(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(path);
  }
}
