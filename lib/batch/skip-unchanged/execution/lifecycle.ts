import { Context } from '../../../interface';
import * as api from '../../../services/api.service';
import { getCurrentCommit } from '../../../services/git.service';
import { createLogger } from '../../../services/logger.service';

import { withAnalysisCacheHead } from '../planning/fingerprint';
import {
  getAnalysisPlan,
  getCurrentAnalysisEntry,
  setCurrentAnalysisEntry,
} from '../state';

const logger = createLogger('SKIP UNCHANGED');

export async function prepareAnalyzedRepository(
  ctx: Context,
  source: string,
  repositoryPath: string
): Promise<void> {
  const planned = getAnalysisPlan(ctx, source);
  setCurrentAnalysisEntry(
    ctx,
    planned
      ? withAnalysisCacheHead(
          planned.entry,
          await getCurrentCommit(repositoryPath)
        )
      : undefined
  );
}

export async function recordAnalyzedProject(
  ctx: Context,
  projectName?: string
): Promise<void> {
  const entry = getCurrentAnalysisEntry(ctx);
  if (!entry || !projectName) {
    return;
  }

  try {
    await api.recordAnalyzedProject({ projectName, ...entry });
  } catch (error) {
    logger.debug(
      `Unable to record analysis cache state: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
