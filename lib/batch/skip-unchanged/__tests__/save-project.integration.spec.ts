import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Context } from '../../../interface';
import * as api from '../../../services/api.service';
import { saveProjectApiTask } from '../../../tasks/save-project-api.task';

import { recordAnalyzedProject } from '../index';

vi.mock('../index', () => ({
  recordAnalyzedProject: vi.fn(),
}));
vi.mock('../../../services/api.service', () => ({
  uploadProject: vi.fn(),
  uploadAnalyzerTelemetry: vi.fn(),
}));

describe('saveProjectApiTask skip-unchanged integration', () => {
  beforeEach(() => {
    vi.mocked(recordAnalyzedProject).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.uploadProject).mockReset().mockResolvedValue(undefined);
  });

  it('does not record reusable analysis state before batch finalization', async () => {
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
      batch: { queue: [], analyzed: [], skipped: [], failed: [] },
      debug: {},
    } as Context;

    await (saveProjectApiTask.task as any)(ctx, {
      title: 'Save project results (Omniboard.dev)',
    });

    expect(api.uploadProject).toHaveBeenCalled();
    expect(recordAnalyzedProject).not.toHaveBeenCalled();
  });
});
