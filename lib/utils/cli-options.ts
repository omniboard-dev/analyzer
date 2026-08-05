import { Argv } from 'yargs';

export function configureCliOptions(yargs: Argv): Argv {
  return yargs
    .parserConfiguration({ 'boolean-negation': false })
    .strictOptions();
}
