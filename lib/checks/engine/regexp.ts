export function testRegExpStateless(regexp: RegExp, value: string): boolean {
  regexp.lastIndex = 0;

  try {
    return regexp.test(value);
  } finally {
    regexp.lastIndex = 0;
  }
}

export function getRegExpKey(regexp?: RegExp): string {
  return regexp ? `${regexp.source}/${regexp.flags}` : '';
}
