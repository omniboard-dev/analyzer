import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../interface';
import * as api from '../services/api.service';

import { testConnectionTask } from './test-connection.task';

vi.mock('../services/api.service', () => ({
  ping: vi.fn(),
}));

function createContext(expectedGroup?: string): Context {
  return {
    options: {
      apiKey: 'test-key',
      expectedGroup,
    } as Context['options'],
    control: {
      skipEverySubsequentTask: false,
    },
    settings: {},
    definitions: {},
    results: {},
    handledCheckFailures: [],
    batch: {
      queue: [],
      completed: [],
      failed: [],
    },
    debug: {},
  };
}

async function runTask(ctx: Context) {
  const task = { title: 'Verify API destination' };
  await (testConnectionTask.task as any)(ctx, task);
  return task;
}

describe('testConnectionTask', () => {
  beforeEach(() => {
    vi.mocked(api.ping).mockReset().mockResolvedValue({
      group: 'RWC',
      organization: 'Mobiliar',
    });
  });

  it('reports and stores the authenticated API destination', async () => {
    const ctx = createContext();

    const task = await runTask(ctx);

    expect(task.title).toBe(
      'Verify API destination successful, organization: Mobiliar, group: RWC'
    );
    expect(ctx.debug.apiIdentity).toEqual({
      group: 'RWC',
      organization: 'Mobiliar',
    });
  });

  it('matches the expected group case-insensitively', async () => {
    await expect(runTask(createContext('rwc'))).resolves.toBeDefined();
  });

  it('fails before analysis when the API key belongs to another group', async () => {
    vi.mocked(api.ping).mockResolvedValue({
      group: 'Gluon',
      organization: 'Mobiliar',
    });

    await expect(runTask(createContext('RWC'))).rejects.toThrow(
      'Authenticated Omniboard group "Gluon" does not match expected group "RWC"'
    );
  });
});
