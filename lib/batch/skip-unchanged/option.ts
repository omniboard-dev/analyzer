import { Argv } from 'yargs';

import { Context } from '../../interface';

type SkipUnchangedOptions = Context['options'] & {
  skipUnchanged?: boolean;
};

export function addSkipUnchangedOption(yargs: Argv): Argv {
  return yargs.option('skip-unchanged', {
    type: 'boolean',
    default: true,
    description: 'Skip repositories with matching successful analysis state',
  });
}

export function isSkipUnchangedEnabled(ctx: Context): boolean {
  return (ctx.options as SkipUnchangedOptions).skipUnchanged !== false;
}
