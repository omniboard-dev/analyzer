type PathToken =
  | { type: 'property'; key: string }
  | { type: 'index'; index: number }
  | { type: 'arrayWildcard' }
  | { type: 'objectWildcard' };

const SIMPLE_PROPERTY_PATTERN = /^[A-Za-z_$][\w$-]*$/;

export function readYamlPath(data: unknown, path: string): any[] {
  const tokens = parseYamlPath(path);
  const values = tokens.reduce(
    (currentValues, token) => resolvePathToken(currentValues, token),
    [data] as unknown[]
  );

  return values.filter((value) => value !== null && value !== undefined);
}

function parseYamlPath(path: string): PathToken[] {
  const source = path.trim();
  assertSupportedPathSyntax(source);

  const tokens: PathToken[] = [];
  let index = source.startsWith('$') ? 1 : 0;

  while (index < source.length) {
    const char = source[index];

    if (char === '.') {
      if (source[index + 1] === '*') {
        tokens.push({ type: 'objectWildcard' });
        index += 2;
        continue;
      }

      const property = readDotProperty(source, index + 1);
      tokens.push({ type: 'property', key: property.value });
      index = property.end;
      continue;
    }

    if (char === '[') {
      const bracket = readBracketToken(source, index);
      tokens.push(bracket.token);
      index = bracket.end;
      continue;
    }

    const property = readDotProperty(source, index);
    tokens.push({ type: 'property', key: property.value });
    index = property.end;
  }

  if (!tokens.length) {
    throw new Error(`Unsupported YAML path "${path}"`);
  }

  return tokens;
}

function readDotProperty(source: string, start: number) {
  let end = start;
  while (end < source.length && source[end] !== '.' && source[end] !== '[') {
    end++;
  }

  if (end === start) {
    throw new Error(`Unsupported YAML path syntax near "${source.slice(start)}"`);
  }

  return {
    value: readSimpleProperty(source, start, end),
    end,
  };
}

function assertSupportedPathSyntax(source: string) {
  if (source.includes('|') || source.includes('//') || source.includes('..')) {
    throw new Error(
      'Unsupported YAML path syntax: pipelines, fallbacks, and recursive descent are not supported'
    );
  }
}

function readSimpleProperty(source: string, start: number, end: number) {
  const property = source.slice(start, end);

  if (!SIMPLE_PROPERTY_PATTERN.test(property)) {
    throw new Error(`Unsupported YAML path property "${property}"`);
  }

  return property;
}

function readBracketToken(source: string, start: number) {
  const end = source.indexOf(']', start);
  if (end === -1) {
    throw new Error(`Unsupported YAML path syntax near "${source.slice(start)}"`);
  }

  const content = source.slice(start + 1, end).trim();

  if (content === '' || content === '*') {
    return {
      token: { type: 'arrayWildcard' } as PathToken,
      end: end + 1,
    };
  }

  if (/^\d+$/.test(content)) {
    return {
      token: { type: 'index', index: Number(content) } as PathToken,
      end: end + 1,
    };
  }

  if (
    (content.startsWith('"') && content.endsWith('"')) ||
    (content.startsWith("'") && content.endsWith("'"))
  ) {
    return {
      token: { type: 'property', key: unquotePathKey(content) } as PathToken,
      end: end + 1,
    };
  }

  throw new Error(`Unsupported YAML path syntax near "[${content}]"`);
}

function unquotePathKey(content: string) {
  return content.slice(1, -1).replace(/\\(['"\\])/g, '$1');
}

function resolvePathToken(values: unknown[], token: PathToken): unknown[] {
  return values.flatMap((value) => resolveValuePathToken(value, token));
}

function resolveValuePathToken(value: unknown, token: PathToken): unknown[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (token.type === 'arrayWildcard') {
    return Array.isArray(value) ? value : [];
  }

  if (token.type === 'objectWildcard') {
    return isRecord(value) ? Object.values(value) : [];
  }

  if (token.type === 'index') {
    return Array.isArray(value) && token.index < value.length
      ? [value[token.index]]
      : [];
  }

  return isRecord(value) &&
    Object.prototype.hasOwnProperty.call(value, token.key)
    ? [value[token.key]]
    : [];
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
