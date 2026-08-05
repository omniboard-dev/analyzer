import { ListrTask } from 'listr2';

import { Context } from '../../../interface';
import * as api from '../../../services/api.service';
import { getRemoteHead } from '../../../services/git.service';
import {
  completeProjectPlanning,
  failProjectPlanning,
  startProjectPlanning,
} from '../../telemetry/state';

import { isSkipUnchangedEnabled } from '../option';
import { setAnalysisPlans } from '../state';

import { BatchAnalysisPlan, createAnalysisCacheEntry } from './fingerprint';

const REMOTE_HEAD_CONCURRENCY = 8;
const ANALYSIS_PLAN_CHUNK_SIZE = 250;

export const planUnchangedJobsTask: ListrTask = {
  title: 'Plan unchanged projects',
  skip: (ctx: Context) => {
    if (ctx.control.skipEverySubsequentTask) {
      return true;
    }
    if (!isSkipUnchangedEnabled(ctx)) {
      return 'Unchanged project skipping disabled';
    }
    if (ctx.options.json) {
      return 'Local JSON output cannot use the server analysis cache';
    }
    if (ctx.options.checkPattern || ctx.options.checkDefinition) {
      return 'Filtered analysis cannot use the server analysis cache';
    }
    return false;
  },
  task: async (ctx: Context, task) => {
    startProjectPlanning(ctx);
    setAnalysisPlans(ctx, undefined);
    const resolved = await mapWithConcurrency(
      ctx.batch.queue,
      REMOTE_HEAD_CONCURRENCY,
      async (source) => {
        try {
          const remoteHead = await getRemoteHead(source);
          return {
            source,
            entry: createAnalysisCacheEntry(source, remoteHead, ctx),
          };
        } catch {
          return undefined;
        }
      }
    );
    const candidates = resolved.filter(
      (
        result
      ): result is {
        source: string;
        entry: ReturnType<typeof createAnalysisCacheEntry>;
      } => Boolean(result)
    );

    if (!candidates.length) {
      completeProjectPlanning(ctx, {
        checkedProjects: 0,
        unchangedProjects: 0,
        unresolvedHeadProjects: ctx.batch.queue.length,
      });
      task.skip('No remote HEAD revisions could be resolved');
      return;
    }

    try {
      const decisions = [];
      for (
        let index = 0;
        index < candidates.length;
        index += ANALYSIS_PLAN_CHUNK_SIZE
      ) {
        decisions.push(
          ...(await api.planProjectAnalyses(
            candidates
              .slice(index, index + ANALYSIS_PLAN_CHUNK_SIZE)
              .map(({ entry }) => ({
                sourceKey: entry.sourceKey,
                fingerprint: entry.fingerprint,
              }))
          ))
        );
      }
      const decisionsBySourceKey = new Map(
        decisions.map((decision) => [decision.sourceKey, decision])
      );
      const plans: Record<string, BatchAnalysisPlan> = {};
      for (const { source, entry } of candidates) {
        plans[source] = {
          entry,
          decision: decisionsBySourceKey.get(entry.sourceKey) ?? {
            sourceKey: entry.sourceKey,
            action: 'analyze',
          },
        };
      }
      setAnalysisPlans(ctx, plans);

      const unchanged = Object.values(plans).filter(
        ({ decision }) => decision.action === 'skip'
      ).length;
      completeProjectPlanning(ctx, {
        checkedProjects: candidates.length,
        unchangedProjects: unchanged,
        unresolvedHeadProjects: ctx.batch.queue.length - candidates.length,
      });
      task.title = `${task.title}: ${unchanged} unchanged, ${
        ctx.batch.queue.length - unchanged
      } to analyze`;
    } catch {
      failProjectPlanning(ctx, ctx.batch.queue.length - candidates.length);
      task.skip('Analysis cache unavailable; all projects will be analyzed');
    }
  },
};

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (nextIndex < values.length) {
        const index = nextIndex++;
        results[index] = await mapper(values[index]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
