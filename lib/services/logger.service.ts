import chalk from 'chalk';

export const createLogger = (context: string) => {
  const prefix = `@omniboard/analyzer [${context}]`;
  return {
    debug: (...args: any) => console.log(chalk.grey(prefix, ...args)),
    info: (...args: any) => console.log(prefix, ...args),
    success: (...args: any) => console.log(chalk.green.bold(prefix, ...args)),
    warning: (...args: any) => console.log(chalk.yellow.bold(prefix, ...args)),
    error: (...args: any) => console.log(chalk.red.bold(prefix, ...args))
  };
};
