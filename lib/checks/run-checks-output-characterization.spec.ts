import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { Listr } from 'listr2';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CheckType,
  Context,
  JSONCheckDefinition,
  YAMLCheckDefinition,
} from '../interface';
import { runChecksTask } from '../tasks/run-checks.task';

const originalWorkingDirectory = process.cwd();
let testDirectory: string | undefined;

function writeFixtureFile(filePath: string, content: string) {
  const absolutePath = p.join(testDirectory!, filePath);
  fs.mkdirSync(p.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

function createContext(): Context {
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
      checks: [
        {
          name: 'content-markers',
          type: CheckType.CONTENT,
          disabled: false,
          filesPattern: '\\.ts$',
          contentPattern: 'marker\\s*=\\s*"(?<value>[^"]+)"',
          contentPatternFlags: 'g',
        },
        {
          name: 'content-no-match',
          type: CheckType.CONTENT,
          disabled: false,
          filesPattern: '\\.ts$',
          contentPattern: 'not-present',
        },
        {
          name: 'content-no-files',
          type: CheckType.CONTENT,
          disabled: false,
          filesPattern: '\\.does-not-exist$',
          contentPattern: 'anything',
        },
        {
          name: 'typescript-files',
          type: CheckType.FILE,
          disabled: false,
          filesPattern: '\\.ts$',
        },
        {
          name: 'typescript-size',
          type: CheckType.SIZE,
          disabled: false,
          filesPattern: '\\.ts$',
          filesExcludePattern: '(^|/)(dist|node_modules)(/|$)',
        },
        {
          name: 'json-target',
          type: CheckType.JSON,
          disabled: false,
          filesPattern: '\\.json$',
          jsonPropertyPath: '.targets[*].name',
        } as JSONCheckDefinition,
        {
          name: 'yaml-target',
          type: CheckType.YAML,
          disabled: false,
          filesPattern: '\\.ya?ml$',
          yamlPropertyPath: '$.targets[*].name',
        } as YAMLCheckDefinition,
        {
          name: 'xpath-original-attribute',
          type: CheckType.XPATH,
          disabled: false,
          filesPattern: 'template\\.html$',
          xpathExpression: '//item/@data.value',
          xpathSanitizeAngularTemplate: false,
        },
        {
          name: 'xpath-sanitized-attribute',
          type: CheckType.XPATH,
          disabled: false,
          filesPattern: 'template\\.html$',
          xpathExpression: '//item/@datavalue',
          xpathSanitizeAngularTemplate: true,
        },
        {
          name: 'xpath-malformed',
          type: CheckType.XPATH,
          disabled: false,
          filesPattern: 'invalid\\.xml$',
          xpathExpression: '//item/text()',
        },
        {
          name: 'project-applicable',
          type: CheckType.FILE,
          disabled: false,
          filesPattern: 'alpha\\.ts$',
          projectNamePattern: '^demo-project$',
        },
        {
          name: 'disabled-check',
          type: CheckType.FILE,
          disabled: true,
          filesPattern: '\\.ts$',
        },
        {
          name: 'metadata-check',
          type: CheckType.META,
          disabled: false,
          filesPattern: '.*',
        },
        {
          name: 'other-project-only',
          type: CheckType.FILE,
          disabled: false,
          filesPattern: '\\.ts$',
          projectNamePattern: '^other-project$',
        },
      ] as any,
    },
    results: {
      name: 'demo-project',
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

async function runFixtureChecks(ctx: Context) {
  const tasks = new Listr([runChecksTask], { renderer: 'silent' });
  await tasks.run(ctx);
}

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  if (testDirectory) {
    fs.rmSync(testDirectory, { recursive: true, force: true });
    testDirectory = undefined;
  }
});

describe('runChecksTask output characterization', () => {
  it('preserves exact results for overlapping selectors and every check type', async () => {
    testDirectory = fs.mkdtempSync(
      p.join(tmpdir(), 'omniboard-analyzer-characterization-')
    );
    writeFixtureFile(
      'alpha.ts',
      'const marker = "one";\nconst marker = "two";\n'
    );
    writeFixtureFile('beta.ts', 'const untouched = true;\n');
    writeFixtureFile('dist/generated.ts', 'const marker = "excluded";\n');
    writeFixtureFile(
      'config.json',
      '{\n  // accepted comment\n  "targets": [{"name": "web"}, {"name": "admin"}],\n}\n'
    );
    writeFixtureFile('invalid.json', '{"targets": }');
    writeFixtureFile(
      'config.yaml',
      'targets:\n  - name: api\n  - name: worker\n'
    );
    writeFixtureFile('invalid.yaml', 'targets: [');
    writeFixtureFile(
      'template.html',
      '\uFEFF<root>\n  <item data.value="selected">Text</item>\n</root>\n'
    );
    writeFixtureFile('invalid.xml', '<root><item>broken</wrong></root>');
    process.chdir(testDirectory);

    const ctx = createContext();
    await runFixtureChecks(ctx);

    expect(ctx.results.checks).toEqual({
      'content-markers': {
        name: 'content-markers',
        type: CheckType.CONTENT,
        value: true,
        matches: [
          {
            file: 'alpha.ts',
            matches: [
              { match: 'marker = "one"', groups: { value: 'one' } },
              { match: 'marker = "two"', groups: { value: 'two' } },
            ],
          },
        ],
      },
      'content-no-match': {
        name: 'content-no-match',
        type: CheckType.CONTENT,
        value: false,
        matches: [],
      },
      'content-no-files': {
        name: 'content-no-files',
        type: CheckType.CONTENT,
        value: false,
      },
      'typescript-files': {
        name: 'typescript-files',
        type: CheckType.FILE,
        value: true,
        matches: [
          { file: 'alpha.ts', matches: [] },
          { file: 'beta.ts', matches: [] },
        ],
      },
      'typescript-size': {
        name: 'typescript-size',
        type: CheckType.SIZE,
        value: true,
        size: {
          total: 68,
          totalHumanReadable: '68 B',
          details: [
            { file: 'alpha.ts', size: 44, sizeHumanReadable: '44 B' },
            { file: 'beta.ts', size: 24, sizeHumanReadable: '24 B' },
          ],
        },
      },
      'json-target': {
        name: 'json-target',
        type: CheckType.JSON,
        value: true,
        matches: [
          {
            file: 'config.json',
            matches: [
              {
                match: '.targets[*].name',
                groups: { '.targets[*].name': 'web' },
              },
              {
                match: '.targets[*].name',
                groups: { '.targets[*].name': 'admin' },
              },
            ],
          },
        ],
      },
      'yaml-target': {
        name: 'yaml-target',
        type: CheckType.YAML,
        value: true,
        matches: [
          {
            file: 'config.yaml',
            matches: [
              {
                match: '$.targets[*].name',
                groups: { '$.targets[*].name': ['api', 'worker'] },
              },
            ],
          },
        ],
      },
      'xpath-original-attribute': {
        name: 'xpath-original-attribute',
        type: CheckType.XPATH,
        value: true,
        matches: [
          {
            file: 'template.html',
            matches: [
              {
                match: 'root > item > data.value',
                lineNumber: 2,
                columnNumber: 20,
                groups: { 'data.value': 'selected' },
              },
            ],
          },
        ],
      },
      'xpath-sanitized-attribute': {
        name: 'xpath-sanitized-attribute',
        type: CheckType.XPATH,
        value: true,
        matches: [
          {
            file: 'template.html',
            matches: [
              {
                match: 'root > item > datavalue',
                lineNumber: 2,
                columnNumber: 19,
                groups: { datavalue: 'selected' },
              },
            ],
          },
        ],
      },
      'xpath-malformed': {
        name: 'xpath-malformed',
        type: CheckType.XPATH,
        value: false,
        matches: [],
      },
      'project-applicable': {
        name: 'project-applicable',
        type: CheckType.FILE,
        value: true,
        matches: [{ file: 'alpha.ts', matches: [] }],
      },
    });

    expect(ctx.results.checks).not.toHaveProperty('disabled-check');
    expect(ctx.results.checks).not.toHaveProperty('metadata-check');
    expect(ctx.results.checks).not.toHaveProperty('other-project-only');
    expect(ctx.handledCheckFailures.map(({ message }) => message)).toEqual([
      expect.stringMatching(
        /^\[xpath\] "xpath-malformed"\n   File: invalid\.xml\n   Error:/
      ),
      expect.stringMatching(
        /^\[json\] "json-target"\n   File: invalid\.json\n   Error:/
      ),
      expect.stringMatching(/^\[yaml\] "yaml-target" - invalid\.yaml - /),
    ]);
  });
});
