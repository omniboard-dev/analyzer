import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CheckType,
  Context,
  JSONCheckDefinition,
  ParentTask,
  YAMLCheckDefinition,
} from '../interface';

import { jsonCheckTaskFactory } from './json.check';
import { yamlCheckTaskFactory } from './yaml.check';

const originalWorkingDirectory = process.cwd();
let testDirectory: string | undefined;

function createContext(): Context {
  return {
    options: {} as Context['options'],
    control: {
      skipEverySubsequentTask: false,
    },
    settings: {
      analyzerCheckExecutionTimeout: 25,
    },
    definitions: {},
    results: {
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

function createInvalidFile(name: string, content: string) {
  testDirectory = fs.mkdtempSync(p.join(tmpdir(), 'omniboard-analyzer-'));
  fs.writeFileSync(p.join(testDirectory, name), content);
  process.chdir(testDirectory);
}

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  if (testDirectory) {
    fs.rmSync(testDirectory, { recursive: true, force: true });
    testDirectory = undefined;
  }
});

describe('structured check warning flow', () => {
  it('completes an all-invalid JSON check with a false result and warning', async () => {
    createInvalidFile('invalid.json', '{"broken": }');
    const ctx = createContext();
    const parentTask: ParentTask = { title: 'Run checks 0/1' };
    const definition: JSONCheckDefinition = {
      name: 'invalid-json',
      type: CheckType.JSON,
      disabled: false,
      filesPattern: 'invalid\\.json$',
      jsonPropertyPath: '$.target',
    };
    const task = { title: 'JSON check' } as any;

    await jsonCheckTaskFactory(definition, parentTask)(ctx, task);

    expect(ctx.results.checks?.['invalid-json']).toEqual({
      name: 'invalid-json',
      type: CheckType.JSON,
      value: false,
      matches: [],
    });
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(parentTask.title).toBe('Run checks 1/1');
    expect(task.title).toBe(ctx.handledCheckFailures[0].message);
  });

  it('completes an all-invalid YAML check with a false result and warning', async () => {
    createInvalidFile('invalid.yaml', 'target: [');
    const ctx = createContext();
    const parentTask: ParentTask = { title: 'Run checks 0/1' };
    const definition: YAMLCheckDefinition = {
      name: 'invalid-yaml',
      type: CheckType.YAML,
      disabled: false,
      filesPattern: 'invalid\\.yaml$',
      yamlPropertyPath: '$.target',
    };
    const task = { title: 'YAML check' } as any;

    await yamlCheckTaskFactory(definition, parentTask)(ctx, task);

    expect(ctx.results.checks?.['invalid-yaml']).toEqual({
      name: 'invalid-yaml',
      type: CheckType.YAML,
      value: false,
      matches: [],
    });
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(parentTask.title).toBe('Run checks 1/1');
    expect(task.title).toBe(ctx.handledCheckFailures[0].message);
  });
});
