import * as fs from 'fs';
import * as path from 'path';
import filesize from 'filesize';
import { DOMParser } from 'xmldom';

const REGEXP_MATCH_NOTHING = /a^/;

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
      .map(nextPath => path.join(currentPath, nextPath));
    const dirs = paths.filter(
      nextPath =>
        !excludeRegexp.test(nextPath) && fs.lstatSync(nextPath).isDirectory()
    );
    const files = paths.filter(
      nextPath =>
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
  const buffer = fs.readFileSync(path);
  return JSON.parse(buffer.toString());
}

export function readXmlAsDom(path: string) {
  const buffer = fs.readFileSync(path);
  return new DOMParser().parseFromString(
    buffer.toString().replace(/(\r)?\n/g, '')
  );
}

export function writeJson(destinationPath: string, data: any) {
  const { base, dir } = path.parse(destinationPath);
  const stringifiedData = JSON.stringify(data, null, 2);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destinationPath, stringifiedData);
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
