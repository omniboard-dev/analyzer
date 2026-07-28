import { Context, Settings } from '../interface';

type ProjectResults = Context['results'];

export interface RejectedCheckResult {
  name: string;
  size: number;
  limit: number;
  reason: 'per-check' | 'total';
}

export interface PreparedProjectResults {
  results: ProjectResults;
  rejectedCheckResults: RejectedCheckResult[];
}

interface CheckResultEntry {
  name: string;
  result: NonNullable<ProjectResults['checks']>[string];
  size: number;
  index: number;
}

function resolveLimitBytes(limitKb: number | undefined) {
  return typeof limitKb === 'number' && Number.isFinite(limitKb) && limitKb >= 0
    ? limitKb * 1024
    : undefined;
}

function getResultSize(result: CheckResultEntry['result']) {
  return Buffer.byteLength(JSON.stringify(result), 'utf8');
}

export function prepareProjectResultsForUpload(
  results: ProjectResults,
  settings: Settings
): PreparedProjectResults {
  const entries: CheckResultEntry[] = Object.entries(results.checks ?? {}).map(
    ([name, result], index) => ({
      name,
      result,
      size: getResultSize(result),
      index,
    })
  );
  const checkResultLimit = resolveLimitBytes(settings.checkResultSizeLimit);
  const totalCheckResultsLimit = resolveLimitBytes(
    settings.totalCheckResultSizeLimit
  );
  const rejectedCheckResults: RejectedCheckResult[] = [];
  const rejectedCheckNames = new Set<string>();

  if (checkResultLimit !== undefined) {
    entries.forEach(({ name, size }) => {
      if (size > checkResultLimit) {
        rejectedCheckNames.add(name);
        rejectedCheckResults.push({
          name,
          size,
          limit: checkResultLimit,
          reason: 'per-check',
        });
      }
    });
  }

  if (totalCheckResultsLimit !== undefined) {
    const acceptedEntries = entries.filter(
      ({ name }) => !rejectedCheckNames.has(name)
    );
    let totalSize = acceptedEntries.reduce(
      (total, { size }) => total + size,
      0
    );

    if (totalSize > totalCheckResultsLimit) {
      const largestFirst = [...acceptedEntries].sort(
        (a, b) => b.size - a.size || a.index - b.index
      );

      for (const { name, size } of largestFirst) {
        if (totalSize <= totalCheckResultsLimit) {
          break;
        }
        rejectedCheckNames.add(name);
        rejectedCheckResults.push({
          name,
          size,
          limit: totalCheckResultsLimit,
          reason: 'total',
        });
        totalSize -= size;
      }
    }
  }

  return {
    results: {
      ...results,
      checks: Object.fromEntries(
        entries
          .filter(({ name }) => !rejectedCheckNames.has(name))
          .map(({ name, result }) => [name, result])
      ),
    },
    rejectedCheckResults,
  };
}
