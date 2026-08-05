import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handler as batchHandler } from '../batch/batch';
import { testConnectionTask } from '../tasks/test-connection.task';
import { runner } from '../utils/process';

import { handler as analyzeHandler } from './analyze';

vi.mock('../utils/process', () => ({
  runner: vi.fn(),
}));

const handlers = [
  ['analyze', analyzeHandler],
  ['batch', batchHandler],
] as const;

describe('expected group verification', () => {
  beforeEach(() => {
    vi.mocked(runner).mockReset().mockResolvedValue(undefined);
  });

  it.each(handlers)(
    'does not verify the API destination for %s by default',
    async (_command, handler) => {
      await handler({});

      expect(vi.mocked(runner).mock.calls[0][0]).not.toContain(
        testConnectionTask
      );
    }
  );

  it.each(handlers)(
    'verifies the API destination for %s when expected-group is provided',
    async (_command, handler) => {
      await handler({ expectedGroup: 'RWC' });

      expect(vi.mocked(runner).mock.calls[0][0][0]).toBe(testConnectionTask);
    }
  );
});
