const REGEX_UNSET_DEFAULT_TOKEN = 'EMPTY';

export function resolveActiveFlags(
  flags: string | undefined,
  defaultFlags: string
): string {
  return flags === REGEX_UNSET_DEFAULT_TOKEN ? '' : flags || defaultFlags;
}
