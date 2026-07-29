import * as fs from 'fs';
import { tmpdir } from 'os';
import * as p from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { readXmlAsDom, writeJson } from './fs.service';

const originalWorkingDirectory = process.cwd();
let testDirectory: string | undefined;

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  if (testDirectory) {
    fs.rmSync(testDirectory, { recursive: true, force: true });
    testDirectory = undefined;
  }
});

describe('writeJson', () => {
  it('writes a basename-only path in the current directory', () => {
    testDirectory = fs.mkdtempSync(p.join(tmpdir(), 'omniboard-analyzer-'));
    process.chdir(testDirectory);

    writeJson('job.json', { queue: [] });

    expect(JSON.parse(fs.readFileSync('job.json', 'utf8'))).toEqual({
      queue: [],
    });
  });
});

describe('readXmlAsDom', () => {
  it('parses an XML declaration preceded by a UTF-8 BOM', () => {
    testDirectory = fs.mkdtempSync(p.join(tmpdir(), 'omniboard-analyzer-'));
    const xmlPath = p.join(testDirectory, 'pom.xml');
    fs.writeFileSync(
      xmlPath,
      '\uFEFF<?xml version="1.0" encoding="UTF-8"?><project />'
    );

    const document = readXmlAsDom(xmlPath);

    expect(document.documentElement.nodeName).toBe('project');
  });
});
