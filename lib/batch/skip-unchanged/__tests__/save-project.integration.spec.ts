import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../../../interface';
import * as api from '../../../services/api.service';
import { saveProjectApiTask } from '../../../tasks/save-project-api.task';

import { recordCompletedAnalysis } from '../index';

vi.mock('../index', () => ({
  recordCompletedAnalysis: vi.fn(),
}));
vi.mock('../../../services/api.service', () => ({
  uploadProject: vi.fn(),
  uploadAnalyzerTelemetry: vi.fn(),
}));

describe('saveProjectApiTask skip-unchanged integration', () => {
  beforeEach(() => {
    vi.mocked(recordCompletedAnalysis).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.uploadProject).mockReset().mockResolvedValue(undefined);
  });

  it('records completion only after a successful project upload', async () => {
    const ctx = {
      options: { errorsAsWarnings: false },
      control: { skipEverySubsequentTask: false },
      settings: {},
      definitions: {},
      results: {
        name: 'project-a',
        checks: {},
      },
      handledCheckFailures: [],
      batch: { queue: [], completed: [], failed: [] },
      debug: {},
    } as Context;

    await (saveProjectApiTask.task as any)(ctx, {
      title: 'Save project results (Omniboard.dev)',
    });

    expect(recordCompletedAnalysis).toHaveBeenCalledWith(ctx, 'project-a');
    expect(
      vi.mocked(api.uploadProject).mock.invocationCallOrder[0]
    ).toBeLessThan(
      vi.mocked(recordCompletedAnalysis).mock.invocationCallOrder[0]
    );
  });
});
