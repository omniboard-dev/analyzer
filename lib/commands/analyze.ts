import { Argv } from 'yargs';

export const command = 'analyze';

export const aliases = [];

export const describe = 'Analyze project';

export const builder = (yargs: Argv) => yargs;

export const handler = (argv: any) => {
  console.log(argv);
};
