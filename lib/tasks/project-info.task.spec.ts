import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { Listr } from 'listr2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../interface';
import * as git from '../services/git.service';

import { handledCheckFailureInfoTask } from './handled-check-failure-info.tast';
import { projectInfoTask } from './project-info.task';

vi.mock('../services/git.service', () => ({
  getCurrentBranch: vi.fn(),
}));

const originalWorkingDirectory = process.cwd();
let testDirectory: string | undefined;

function createContext(): Context {
  return {
    options: {
      sanitizeRepoUrl: true,
      silent: true,
    } as Context['options'],
    control: {
      skipEverySubsequentTask: false,
    },
    settings: {},
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

function writePom(path: string, content: string) {
  fs.mkdirSync(p.dirname(path), { recursive: true });
  fs.writeFileSync(path, content);
}

function createValidAndMalformedPoms() {
  testDirectory = fs.mkdtempSync(p.join(tmpdir(), 'omniboard-analyzer-'));
  writePom(
    p.join(testDirectory, 'pom.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <artifactId>valid-project</artifactId>
  <scm>
    <connection>scm:git:https://gitlab.com/example/valid-project.git</connection>
  </scm>
</project>`
  );
  writePom(
    p.join(testDirectory, 'module', 'pom.xml'),
    `<project>
  <artifactId>broken-project</artifactId>
  <properties><testOnly>false</wrongClosingTag></properties>
</project>`
  );
  process.chdir(testDirectory);
}

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  if (testDirectory) {
    fs.rmSync(testDirectory, { recursive: true, force: true });
    testDirectory = undefined;
  }
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(git.getCurrentBranch).mockResolvedValue('main');
});

describe('projectInfoTask Maven warnings', () => {
  it('uses valid POM metadata and records a malformed nested POM once', async () => {
    createValidAndMalformedPoms();
    const ctx = createContext();
    const tasks = new Listr([projectInfoTask], { renderer: 'silent' });

    await tasks.run(ctx);

    expect(ctx.results.name).toBe('valid-project');
    expect(ctx.results.info).toMatchObject({
      type: 'MAVEN',
      branch: 'main',
      repository: 'https://gitlab.com/example/valid-project.git',
    });
    expect(ctx.control.skipEverySubsequentTask).toBe(false);
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(ctx.handledCheckFailures[0].message).toContain(
      '[project-info:maven]'
    );
    expect(ctx.handledCheckFailures[0].message).toContain('module/pom.xml');
  });

  it('skips an unresolvable Maven project but prints its warning in silent mode', async () => {
    testDirectory = fs.mkdtempSync(p.join(tmpdir(), 'omniboard-analyzer-'));
    writePom(
      p.join(testDirectory, 'pom.xml'),
      '<project><artifactId>broken</artifactId></wrongClosingTag>'
    );
    process.chdir(testDirectory);
    const ctx = createContext();
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tasks = new Listr([projectInfoTask, handledCheckFailureInfoTask], {
      renderer: 'silent',
    });

    await tasks.run(ctx);

    expect(ctx.control.skipEverySubsequentTask).toBe(true);
    expect(ctx.handledCheckFailures).toHaveLength(1);
    expect(consoleLog.mock.calls.flat().join(' ')).toContain(
      '1 handled warning occurred'
    );
    expect(consoleLog.mock.calls.flat().join(' ')).toContain(
      '[project-info:maven]'
    );
  });
});
