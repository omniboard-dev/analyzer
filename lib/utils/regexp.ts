const REGEX_UNSET_DEFAULT_TOKEN = 'EMPTY';

export function resolveActiveFlags(
  flags: string | undefined,
  defaultFlags: string
): string {
  return flags === REGEX_UNSET_DEFAULT_TOKEN ? '' : flags || defaultFlags;
}

export function execRegExpAll(
  regexp: RegExp,
  value: string
): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  regexp.lastIndex = 0;

  try {
    if (!regexp.global) {
      const match = regexp.exec(value);
      return match ? [match] : [];
    }

    let match: RegExpExecArray | null;
    while ((match = regexp.exec(value)) !== null) {
      matches.push(match);
      if (match[0] === '') {
        regexp.lastIndex++;
      }
    }

    return matches;
  } finally {
    regexp.lastIndex = 0;
  }
}
