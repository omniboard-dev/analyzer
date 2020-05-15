import path from 'path';
import chalk from 'chalk';

import { readJson } from './fs.service';

let verbose = false;

export const setVerbose = () => (verbose = true);

export const createLogger = (context: string): Logger => {
  const version = readJson(path.join(__dirname, '../../package.json')).version;
  const prefix = `@omniboard/analyzer v${version} [${context}]`;
  return {
    debug: (...args: any) =>
      verbose ? console.log(chalk.grey(prefix, ...args)) : () => {},
    info: (...args: any) => console.log(prefix, ...args),
    success: (...args: any) => console.log(chalk.green.bold(prefix, ...args)),
    warning: (...args: any) => console.log(chalk.yellow.bold(prefix, ...args)),
    error: (...args: any) => console.log(chalk.red.bold(prefix, ...args))
  };
};

export interface Logger {
  debug(...args: any): void;
  info(...args: any): void;
  success(...args: any): void;
  warning(...args: any): void;
  error(...args: any): void;
}
