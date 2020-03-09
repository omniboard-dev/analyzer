import { Argv } from 'yargs';

export const command = 'example';

export const aliases = ['e'];

export const describe = 'Example command';

export const builder = (yargs: Argv) => yargs;

export const handler = (argv: any) => {
  console.log(argv);
};
