import { Context } from '../../interface';

import { AnalysisCacheEntry, BatchAnalysisPlan } from './planning/fingerprint';

const PLANS_KEY = 'skipUnchangedPlans';
const CURRENT_ENTRY_KEY = 'skipUnchangedEntry';

export function getAnalysisPlan(
  ctx: Context,
  source: string
): BatchAnalysisPlan | undefined {
  return getAnalysisPlans(ctx)?.[source];
}

export function setAnalysisPlans(
  ctx: Context,
  plans: Record<string, BatchAnalysisPlan> | undefined
) {
  ctx.debug[PLANS_KEY] = plans;
}

export function getCurrentAnalysisEntry(
  ctx: Context
): AnalysisCacheEntry | undefined {
  return ctx.debug[CURRENT_ENTRY_KEY] as AnalysisCacheEntry | undefined;
}

export function setCurrentAnalysisEntry(
  ctx: Context,
  entry: AnalysisCacheEntry | undefined
) {
  ctx.debug[CURRENT_ENTRY_KEY] = entry;
}

function getAnalysisPlans(
  ctx: Context
): Record<string, BatchAnalysisPlan> | undefined {
  return ctx.debug[PLANS_KEY] as Record<string, BatchAnalysisPlan> | undefined;
}
