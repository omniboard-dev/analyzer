import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { Listr } from 'listr2';
import { afterEach, describe, expect, it } from 'vitest';

import { CheckDefinition, CheckType, Context } from '../interface';
import { runChecksTask } from '../tasks/run-checks.task';

const originalWorkingDirectory = process.cwd();
let testDirectory: string | undefined;

function createContext(definition: CheckDefinition): Context {
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
      checks: [definition],
    },
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

async function runDefinition(definition: CheckDefinition) {
  const ctx = createContext(definition);
  const tasks = new Listr([runChecksTask], { renderer: 'silent' });
  await tasks.run(ctx);
  return ctx;
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
    const definition: CheckDefinition = {
      name: 'invalid-json',
      type: CheckType.JSON,
      disabled: false,
      filesPattern: 'invalid\\.json$',
      jsonPropertyPath: '$.target',
    };

    const ctx = await runDefinition(definition);

    expect(ctx.results.checks?.['invalid-json']).toEqual({
      name: 'invalid-json',
      type: CheckType.JSON,
      value: false,
      matches: [],
    });
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(ctx.handledCheckFailures[0].message).toContain(
      '[json] "invalid-json"'
    );
  });

  it('completes an all-invalid YAML check with a false result and warning', async () => {
    createInvalidFile('invalid.yaml', 'target: [');
    const definition: CheckDefinition = {
      name: 'invalid-yaml',
      type: CheckType.YAML,
      disabled: false,
      filesPattern: 'invalid\\.yaml$',
      yamlPropertyPath: '$.target',
    };

    const ctx = await runDefinition(definition);

    expect(ctx.results.checks?.['invalid-yaml']).toEqual({
      name: 'invalid-yaml',
      type: CheckType.YAML,
      value: false,
      matches: [],
    });
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(ctx.handledCheckFailures[0].message).toContain(
      '[yaml] "invalid-yaml"'
    );
  });
});
