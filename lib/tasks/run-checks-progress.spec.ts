import { describe, expect, it } from 'vitest';

import {
  StreamingCheckMetrics,
  StreamingCheckProgress,
} from '../checks/engine/types';

import { formatFinalMetrics, formatProgress } from './run-checks.task';

const metrics: StreamingCheckMetrics = {
  directoriesVisited: 12,
  directoryEntries: 220,
  filesVisited: 200,
  directoryErrors: 0,
  eligibleFiles: 80,
  logicalCheckFileMatches: 300,
  evaluationsCompleted: 275,
  filesRead: 60,
  bytesRead: 4096,
  statCalls: 3,
  jsonParses: 2,
  yamlParses: 1,
  domParses: 4,
  handledWarnings: 2,
  currentInFlightBytes: 1024,
  peakInFlightBytes: 8192,
  startedAt: 0,
  elapsedMs: 2_000,
  currentDirectory: 'projects/app/src',
};

describe('streaming check progress output', () => {
  it('keeps standard mode compact and useful', () => {
    const output = formatProgress(
      { ...metrics, phase: 'walking' } as StreamingCheckProgress,
      false
    );

    expect(output).toContain('200 files · 80 eligible · 60 read');
    expect(output).toContain('275 evaluations · 4.1 kB · 100 files/s');
    expect(output).not.toContain('directories');
    expect(output).not.toContain('current=');
  });

  it('adds traversal, warning, memory, and location details in verbose mode', () => {
    const output = formatProgress(
      { ...metrics, phase: 'walking' } as StreamingCheckProgress,
      true
    );

    expect(output).toContain('12 directories');
    expect(output).toContain('2 warnings');
    expect(output).toContain('1.02 kB in flight');
    expect(output).toContain('current=projects/app/src');
  });

  it('formats a stable final summary without transient fields', () => {
    expect(formatFinalMetrics(metrics)).toBe(
      '200 files · 80 eligible · 60 read · 275 evaluations · 4.1 kB'
    );
  });
});
