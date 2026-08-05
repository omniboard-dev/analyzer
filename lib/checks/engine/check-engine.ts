import * as p from 'path';

import { CheckType, Context, ProjectCheck } from '../../interface';
import { resolveActiveFlags } from '../../utils/regexp';

import { formatDefaultFileError, resolveErrorMessage } from './check-handler';
import { getCheckHandler } from './check-handler-registry';
import { FileResource } from './file-resource';
import { getRegExpKey, testRegExpStateless } from './regexp';
import {
  CheckDefinition,
  CheckExecutionMetric,
  CheckExecutionSummary,
  CheckExecutionTimeoutError,
  PreparedCheck,
  SkippedCheck,
  StreamingCheckEngineOptions,
  StreamingCheckEngineResult,
  StreamingCheckMetrics,
  StreamingCheckProgress,
} from './types';
import {
  SelectorGroup,
  WalkProjectCounters,
  walkProject,
} from './walk-project';

const FALLBACK_INCLUDE_FILES_FLAG = 'i';
const FALLBACK_EXCLUDE_FILES_PATTERN_FLAGS = 'i';
const FALLBACK_CHECK_EXECUTION_TIMEOUT = 10_000;
const DEFAULT_PROJECT_NAME_PATTERN_FLAGS = 'i';

export interface PreparedCheckRun {
  checks: PreparedCheck[];
  selectorGroups: SelectorGroup[];
  skippedChecks: SkippedCheck[];
}

export function prepareCheckRun(
  ctx: Context,
  definitions: CheckDefinition[]
): PreparedCheckRun {
  const checks: PreparedCheck[] = [];
  const skippedChecks: SkippedCheck[] = [];
  const selectorGroupsByKey = new Map<string, SelectorGroup>();
  const checkNames = new Set<string>();

  definitions.forEach((definition, ordinal) => {
    if (definition.type === CheckType.META) {
      return;
    }

    if (ctx.options.checkPattern) {
      const checkPattern = new RegExp(ctx.options.checkPattern, 'i');
      if (!testRegExpStateless(checkPattern, definition.name)) {
        return;
      }
    }

    if (definition.disabled) {
      skippedChecks.push({ ordinal, definition, reason: 'DISABLED' });
      return;
    }

    if (definition.projectNamePattern) {
      const projectNamePattern = new RegExp(
        definition.projectNamePattern,
        resolveActiveFlags(
          definition.projectNamePatternFlags,
          DEFAULT_PROJECT_NAME_PATTERN_FLAGS
        )
      );
      if (!testRegExpStateless(projectNamePattern, ctx.results.name || '')) {
        skippedChecks.push({
          ordinal,
          definition,
          reason: `project ${ctx.results.name} does not match ${definition.projectNamePattern}`,
        });
        return;
      }
    }

    const handler = getCheckHandler(definition.type);
    if (!handler) {
      skippedChecks.push({
        ordinal,
        definition,
        reason: `Implementation for check type "${definition.type}" not found`,
      });
      return;
    }

    if (checkNames.has(definition.name)) {
      throw new Error(`Duplicate check name "${definition.name}"`);
    }
    checkNames.add(definition.name);

    const includeRegexp = new RegExp(
      definition.filesPattern,
      resolveActiveFlags(
        definition.filesPatternFlags,
        ctx.settings.analyzerIncludeFilesFlag || FALLBACK_INCLUDE_FILES_FLAG
      )
    );
    const excludeRegexp = new RegExp(
      definition.filesExcludePattern || handler.getDefaultExcludePattern(ctx),
      resolveActiveFlags(
        definition.filesExcludePatternFlags,
        ctx.settings.analyzerExcludeFilesPatternFlags ||
          FALLBACK_EXCLUDE_FILES_PATTERN_FLAGS
      )
    );
    const selectorKey = `${getRegExpKey(includeRegexp)}::${getRegExpKey(
      excludeRegexp
    )}`;
    const preparedCheck: PreparedCheck = {
      ordinal,
      definition,
      handler,
      handlerState: handler.prepare(definition, ctx),
      accumulator: {
        selectedFiles: 0,
        matches: [],
        sizeDetails: [],
        errors: [],
        elapsedMs: 0,
      },
    };
    checks.push(preparedCheck);

    const selectorGroup = selectorGroupsByKey.get(selectorKey);
    if (selectorGroup) {
      selectorGroup.checkOrdinals = [...selectorGroup.checkOrdinals, ordinal];
    } else {
      selectorGroupsByKey.set(selectorKey, {
        id: selectorKey,
        includeRegexp,
        excludeRegexp,
        checkOrdinals: [ordinal],
      });
    }
  });

  return {
    checks,
    selectorGroups: Array.from(selectorGroupsByKey.values()),
    skippedChecks,
  };
}

export async function runStreamingCheckEngine(
  ctx: Context,
  definitions: CheckDefinition[],
  options: StreamingCheckEngineOptions = {}
): Promise<StreamingCheckEngineResult> {
  const metrics = createMetrics();
  const prepared = prepareCheckRun(ctx, definitions);
  const checksByOrdinal = new Map(
    prepared.checks.map((check) => [check.ordinal, check])
  );
  const root = p.resolve(options.root ?? process.cwd());
  const emitProgress = (phase: StreamingCheckProgress['phase']) => {
    metrics.elapsedMs = Date.now() - metrics.startedAt;
    options.onProgress?.({ ...metrics, phase });
  };

  emitProgress('preparing');

  const traversalFailedChecks = new Set<number>();
  const iterator = walkProject({
    root,
    selectorGroups: prepared.selectorGroups,
    signal: options.signal,
    yieldEvery: options.yieldEvery,
    onProgress: (counters) => {
      applyWalkCounters(metrics, counters);
      emitProgress('walking');
    },
    onDirectoryError: ({ path, error, checkOrdinals }) => {
      checkOrdinals.forEach((ordinal) => {
        if (traversalFailedChecks.has(ordinal)) {
          return;
        }
        const check = checksByOrdinal.get(ordinal);
        if (!check) {
          return;
        }
        traversalFailedChecks.add(ordinal);
        check.accumulator.errors.push(
          createCheckDirectoryError(check.definition, path, error)
        );
        metrics.handledWarnings++;
      });
    },
  });

  while (true) {
    const next = await iterator.next();
    if (next.done) {
      applyWalkCounters(metrics, next.value);
      break;
    }

    const routedFile = next.value;
    const applicableChecks = routedFile.checkOrdinals
      .map((ordinal) => checksByOrdinal.get(ordinal))
      .filter((check): check is PreparedCheck => Boolean(check));
    const resource = new FileResource(
      p.join(root, ...routedFile.path.split('/')),
      metrics,
      Boolean(options.verbose)
    );

    metrics.currentDirectory = p.posix.dirname(routedFile.path);
    if (metrics.currentDirectory === '.') {
      metrics.currentDirectory = undefined;
    }

    try {
      for (const check of applicableChecks) {
        const startedAt = process.hrtime.bigint();
        evaluateCheck(check, routedFile.path, resource, metrics);
        check.accumulator.elapsedMs +=
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        metrics.evaluationsCompleted++;

        if (check.handler.hasExecutionTimeout) {
          const timeout =
            ctx.settings.analyzerCheckExecutionTimeout ||
            FALLBACK_CHECK_EXECUTION_TIMEOUT;
          if (check.accumulator.elapsedMs > timeout) {
            throw new CheckExecutionTimeoutError(
              createCheckExecutionMetric(check, timeout)
            );
          }
        }
      }
    } finally {
      resource.dispose();
    }
  }

  emitProgress('finalizing');

  const results: Record<string, ProjectCheck> = {};
  const summariesByOrdinal = new Map<number, CheckExecutionSummary>();

  for (const check of prepared.checks.sort(
    (left, right) => left.ordinal - right.ordinal
  )) {
    const result = check.handler.finalize({
      definition: check.definition,
      accumulator: check.accumulator,
    });
    results[check.definition.name] = result;
    summariesByOrdinal.set(check.ordinal, {
      definition: check.definition,
      result,
      errors: check.accumulator.errors,
    });
  }

  const handledCheckFailures = [...prepared.checks]
    .sort(
      (left, right) =>
        left.handler.warningPriority - right.handler.warningPriority ||
        left.ordinal - right.ordinal
    )
    .flatMap((check) => check.accumulator.errors);
  ctx.handledCheckFailures.push(...handledCheckFailures);

  for (const skippedCheck of prepared.skippedChecks) {
    summariesByOrdinal.set(skippedCheck.ordinal, {
      definition: skippedCheck.definition,
      errors: [],
      skippedReason: skippedCheck.reason,
    });
  }

  metrics.elapsedMs = Date.now() - metrics.startedAt;
  metrics.currentDirectory = undefined;
  options.onProgress?.({ ...metrics, phase: 'finalizing' });

  return {
    results,
    summaries: Array.from(summariesByOrdinal.entries())
      .sort(([left], [right]) => left - right)
      .map(([, summary]) => summary),
    metrics,
    checkMetrics: prepared.checks.map((check) =>
      createCheckExecutionMetric(
        check,
        check.handler.hasExecutionTimeout
          ? ctx.settings.analyzerCheckExecutionTimeout ||
              FALLBACK_CHECK_EXECUTION_TIMEOUT
          : undefined
      )
    ),
  };
}

function createCheckExecutionMetric(
  check: PreparedCheck,
  timeoutMs?: number
): CheckExecutionMetric {
  return {
    name: check.definition.name,
    type: check.definition.type,
    evaluatorDurationMs: check.accumulator.elapsedMs,
    evaluatedFiles: check.accumulator.selectedFiles,
    timeoutMs,
  };
}

function evaluateCheck(
  check: PreparedCheck,
  resultPath: string,
  resource: FileResource,
  metrics: StreamingCheckMetrics
) {
  const { definition, handler, handlerState, accumulator } = check;
  accumulator.selectedFiles++;

  try {
    handler.evaluate({
      definition,
      prepared: handlerState,
      resultPath,
      resource,
      accumulator,
      metrics,
    });
  } catch (error) {
    const formatFileError = handler.formatFileError ?? formatDefaultFileError;
    accumulator.errors.push(formatFileError(definition, resultPath, error));
    metrics.handledWarnings++;
  }
}

function createCheckDirectoryError(
  definition: CheckDefinition,
  directory: string,
  error: unknown
): Error {
  return new Error(
    `[${definition.type}] "${
      definition.name
    }"\n   Directory: ${directory}\n   Error: ${resolveErrorMessage(error)}`
  );
}

function createMetrics(): StreamingCheckMetrics {
  return {
    directoriesVisited: 0,
    directoryEntries: 0,
    directoryErrors: 0,
    filesVisited: 0,
    eligibleFiles: 0,
    logicalCheckFileMatches: 0,
    evaluationsCompleted: 0,
    filesRead: 0,
    bytesRead: 0,
    statCalls: 0,
    jsonParses: 0,
    yamlParses: 0,
    domParses: 0,
    handledWarnings: 0,
    currentInFlightBytes: 0,
    peakInFlightBytes: 0,
    startedAt: Date.now(),
    elapsedMs: 0,
  };
}

function applyWalkCounters(
  metrics: StreamingCheckMetrics,
  counters: WalkProjectCounters
) {
  metrics.directoriesVisited = counters.directoriesVisited;
  metrics.directoryEntries = counters.directoryEntries;
  metrics.directoryErrors = counters.directoryErrors;
  metrics.filesVisited = counters.filesVisited;
  metrics.eligibleFiles = counters.eligibleFiles;
  metrics.logicalCheckFileMatches = counters.logicalCheckFileMatches;
}
