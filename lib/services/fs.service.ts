import * as fs from 'fs';
import * as path from 'path';

export function findFiles(
  includePattern: string,
  includeFlags: string = 'i',
  excludePattern: string = '(^\\.|node_modules|coverage|dist)',
  excludeFlags: string = 'i'
) {
  const results = [];
  const stack = ['.'];

  const includeRegexp = new RegExp(includePattern, includeFlags);
  const excludeRegexp = new RegExp(excludePattern, excludeFlags);

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
        includeRegexp.test(nextPath)
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
