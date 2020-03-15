import * as fs from 'fs';
import * as path from 'path';

export function findFiles(filenameRegexp: string) {
  const results = [];
  const stack = ['.'];

  const includeRegexp = new RegExp(filenameRegexp, 'i');
  const excludeRegexp = new RegExp('(^\\.|node_modules|coverage|dist)', 'i');

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
