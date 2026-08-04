import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CheckDefinition, CheckType, Context } from '../../interface';
import * as analyzerFs from '../../services/fs.service';

import { prepareCheckRun, runStreamingCheckEngine } from './check-engine';

const originalWorkingDirectory = process.cwd();
let testDirectory: string | undefined;

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  if (testDirectory) {
    fs.rmSync(testDirectory, { recursive: true, force: true });
    testDirectory = undefined;
  }
  vi.restoreAllMocks();
});

describe('runStreamingCheckEngine', () => {
  it('reads each file once and shares structured parses by representation', async () => {
    createFixture({
      'shared.json': `{
        // supported comment
        "target": { "value": 42 },
      }`,
      'shared.yaml': 'target:\n  value: 42\n',
      'shared.xml':
        '<?xml version="1.0" encoding="UTF-8"?><root><item>value</item></root>',
    });
    const readFile = vi.spyOn(analyzerFs, 'readFile');
    const definitions: CheckDefinition[] = [
      contentCheck('content-target', 'shared\\.json$', 'target'),
      contentCheck('content-value', 'shared\\.json$', 'value'),
      jsonCheck('json-target', '$.target'),
      jsonCheck('json-value', '$.target.value'),
      yamlCheck('yaml-target', '$.target'),
      yamlCheck('yaml-value', '$.target.value'),
      xpathCheck('xpath-item', false, '//item/text()'),
      xpathCheck('xpath-root', false, '//root'),
      xpathCheck('xpath-sanitized', true, '//item/text()'),
    ];
    const ctx = createContext(definitions);

    const execution = await runStreamingCheckEngine(ctx, definitions);

    expect(Object.keys(execution.results)).toEqual(
      definitions.map(({ name }) => name)
    );
    expect(execution.metrics).toMatchObject({
      eligibleFiles: 3,
      logicalCheckFileMatches: 9,
      evaluationsCompleted: 9,
      filesRead: 3,
      statCalls: 0,
      jsonParses: 1,
      yamlParses: 1,
      domParses: 2,
      currentInFlightBytes: 0,
    });
    expect(execution.metrics.peakInFlightBytes).toBeGreaterThan(0);
    expect(readFile).toHaveBeenCalledTimes(3);
  });

  it('advances global zero-width content matches instead of looping forever', async () => {
    createFixture({ 'source.ts': 'ab' });
    const definitions: CheckDefinition[] = [
      contentCheck('zero-width', '\\.ts$', '(?=.)', 'g'),
    ];
    const ctx = createContext(definitions);

    const execution = await runStreamingCheckEngine(ctx, definitions);

    expect(execution.results['zero-width']).toEqual({
      name: 'zero-width',
      type: CheckType.CONTENT,
      value: true,
      matches: [
        {
          file: 'source.ts',
          matches: [
            { match: '', groups: undefined },
            { match: '', groups: undefined },
          ],
        },
      ],
    });
  });

  it('groups identical resolved selectors and preserves skipped definitions', () => {
    const definitions: CheckDefinition[] = [
      contentCheck('first', '\\.ts$', 'first'),
      contentCheck('second', '\\.ts$', 'second'),
      {
        ...contentCheck('disabled', '\\.ts$', 'disabled'),
        disabled: true,
      },
      {
        ...contentCheck('other-project', '\\.ts$', 'other'),
        projectNamePattern: '^other$',
      },
      {
        name: 'metadata',
        type: CheckType.META,
        disabled: false,
        filesPattern: '.*',
      },
    ];
    const ctx = createContext(definitions);

    const prepared = prepareCheckRun(ctx, definitions);

    expect(prepared.checks.map(({ definition }) => definition.name)).toEqual([
      'first',
      'second',
    ]);
    expect(prepared.selectorGroups).toHaveLength(1);
    expect(prepared.selectorGroups[0].checkOrdinals).toEqual([0, 1]);
    expect(
      prepared.skippedChecks.map(({ definition, reason }) => ({
        name: definition.name,
        reason,
      }))
    ).toEqual([
      { name: 'disabled', reason: 'DISABLED' },
      {
        name: 'other-project',
        reason: 'project fixture-project does not match ^other$',
      },
    ]);
  });

  it('fails a check after its configured evaluator budget is exceeded', async () => {
    createFixture({ 'source.ts': 'target' });
    const definitions: CheckDefinition[] = [
      contentCheck('timed', '\\.ts$', 'target'),
    ];
    const ctx = createContext(definitions);
    ctx.settings.analyzerCheckExecutionTimeout = -1;

    await expect(runStreamingCheckEngine(ctx, definitions)).rejects.toThrow(
      'Check "timed" timeout'
    );
  });

  it('does not apply evaluator timeouts to file and size checks', async () => {
    createFixture({ 'source.ts': 'target' });
    const definitions: CheckDefinition[] = [
      {
        name: 'files',
        type: CheckType.FILE,
        disabled: false,
        filesPattern: '\\.ts$',
      },
      {
        name: 'sizes',
        type: CheckType.SIZE,
        disabled: false,
        filesPattern: '\\.ts$',
      },
    ];
    const ctx = createContext(definitions);
    ctx.settings.analyzerCheckExecutionTimeout = -1;

    const execution = await runStreamingCheckEngine(ctx, definitions);

    expect(execution.results['files'].value).toBe(true);
    expect(execution.results['sizes'].value).toBe(true);
    expect(execution.metrics.evaluationsCompleted).toBe(2);
  });

  it('reports handled warnings in walking progress', async () => {
    createFixture({ 'invalid.json': '{"broken": }' });
    const definitions: CheckDefinition[] = [
      {
        name: 'invalid-json',
        type: CheckType.JSON,
        disabled: false,
        filesPattern: 'invalid\\.json$',
        jsonPropertyPath: '$.target',
      },
    ];
    const ctx = createContext(definitions);
    const walkingWarningCounts: number[] = [];

    const execution = await runStreamingCheckEngine(ctx, definitions, {
      yieldEvery: 1,
      onProgress: (progress) => {
        if (progress.phase === 'walking') {
          walkingWarningCounts.push(progress.handledWarnings);
        }
      },
    });

    expect(walkingWarningCounts).toContain(1);
    expect(execution.metrics.handledWarnings).toBe(1);
  });
});

function createFixture(files: Record<string, string>) {
  testDirectory = fs.mkdtempSync(
    p.join(tmpdir(), 'omniboard-streaming-engine-')
  );
  Object.entries(files).forEach(([file, content]) => {
    const path = p.join(testDirectory!, file);
    fs.mkdirSync(p.dirname(path), { recursive: true });
    fs.writeFileSync(path, content, 'utf8');
  });
  process.chdir(testDirectory);
}

function createContext(definitions: CheckDefinition[]): Context {
  return {
    options: {
      silent: true,
      verbose: false,
      showCheckSubtasks: false,
    } as Context['options'],
    control: {
      skipEverySubsequentTask: false,
    },
    settings: {
      analyzerCheckExecutionTimeout: 2_000,
    },
    definitions: {
      checks: definitions,
    },
    results: {
      name: 'fixture-project',
      checks: {},
    },
    handledCheckFailures: [],
    batch: {
      queue: [],
      completed: [],
      failed: [],
    },
    debug: {},
  };
}

function contentCheck(
  name: string,
  filesPattern: string,
  contentPattern: string,
  contentPatternFlags = 'ig'
): CheckDefinition {
  return {
    name,
    type: CheckType.CONTENT,
    disabled: false,
    filesPattern,
    contentPattern,
    contentPatternFlags,
  };
}

function jsonCheck(name: string, jsonPropertyPath: string): CheckDefinition {
  return {
    name,
    type: CheckType.JSON,
    disabled: false,
    filesPattern: 'shared\\.json$',
    jsonPropertyPath,
  };
}

function yamlCheck(name: string, yamlPropertyPath: string): CheckDefinition {
  return {
    name,
    type: CheckType.YAML,
    disabled: false,
    filesPattern: 'shared\\.yaml$',
    yamlPropertyPath,
  };
}

function xpathCheck(
  name: string,
  xpathSanitizeAngularTemplate: boolean,
  xpathExpression: string
): CheckDefinition {
  return {
    name,
    type: CheckType.XPATH,
    disabled: false,
    filesPattern: 'shared\\.xml$',
    xpathExpression,
    xpathSanitizeAngularTemplate,
  };
}
