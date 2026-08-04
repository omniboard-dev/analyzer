import * as p from 'path';
import xpath from 'xpath';
import { JSONPath } from 'jsonpath-plus';

import {
  CheckType,
  ContentCheckDefinition,
  Context,
  JSONCheckDefinition,
  ProjectCheck,
  ProjectCheckMatchDetails,
  XPathCheckDefinition,
  YAMLCheckDefinition,
} from '../../interface';
import * as fs from '../../services/fs.service';
import { resolveActiveFlags } from '../../utils/regexp';
import { readYamlPath } from '../yaml-path';

import { FileResource } from './file-resource';
import { getRegExpKey, testRegExpStateless } from './regexp';
import {
  CheckDefinition,
  CheckExecutionSummary,
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
const FALLBACK_EXCLUDE_FILES_PATTERN_XPATH =
  '((^|\\/)\\.|node_modules|coverage|dist|.teamcity)';
const FALLBACK_EXCLUDE_FILES_PATTERN_CONTENT =
  '((^|\\/)\\.|node_modules|coverage|dist)';
const FALLBACK_EXCLUDE_FILES_PATTERN_SIZE = 'node_modules';
const FALLBACK_CHECK_EXECUTION_TIMEOUT = 10_000;
const DEFAULT_CONTENT_PATTERN_FLAGS = 'ig';
const DEFAULT_PROJECT_NAME_PATTERN_FLAGS = 'i';

const EXECUTABLE_CHECK_TYPES = new Set<CheckType>([
  CheckType.CONTENT,
  CheckType.XPATH,
  CheckType.SIZE,
  CheckType.FILE,
  CheckType.JSON,
  CheckType.YAML,
]);

const CHECK_TYPES_WITH_EXECUTION_TIMEOUT = new Set<CheckType>([
  CheckType.CONTENT,
  CheckType.XPATH,
  CheckType.JSON,
  CheckType.YAML,
]);

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

    if (!EXECUTABLE_CHECK_TYPES.has(definition.type)) {
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
      definition.filesExcludePattern ||
        getDefaultExcludeFilesPattern(ctx, definition.type),
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
      contentPattern:
        definition.type === CheckType.CONTENT
          ? new RegExp(
              (definition as ContentCheckDefinition).contentPattern,
              resolveActiveFlags(
                (definition as ContentCheckDefinition).contentPatternFlags,
                DEFAULT_CONTENT_PATTERN_FLAGS
              )
            )
          : undefined,
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
        evaluateCheck(ctx, check, routedFile.path, resource, metrics);
        check.accumulator.elapsedMs +=
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        metrics.evaluationsCompleted++;

        if (CHECK_TYPES_WITH_EXECUTION_TIMEOUT.has(check.definition.type)) {
          const timeout =
            ctx.settings.analyzerCheckExecutionTimeout ||
            FALLBACK_CHECK_EXECUTION_TIMEOUT;
          if (check.accumulator.elapsedMs > timeout) {
            throw new Error(`Check "${check.definition.name}" timeout`);
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
    const result = finalizeCheck(check);
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
        getWarningPriority(left.definition.type) -
          getWarningPriority(right.definition.type) ||
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
  };
}

function evaluateCheck(
  ctx: Context,
  check: PreparedCheck,
  resultPath: string,
  resource: FileResource,
  metrics: StreamingCheckMetrics
) {
  const { definition, accumulator } = check;
  accumulator.selectedFiles++;

  try {
    switch (definition.type) {
      case CheckType.FILE:
        accumulator.matches.push({ file: resultPath, matches: [] });
        return;
      case CheckType.SIZE: {
        metrics.statCalls++;
        const size = fs.getFileSize(resource.path);
        accumulator.sizeDetails.push({
          file: resultPath,
          size,
          sizeHumanReadable: fs.getHumanReadableFileSize(size),
        });
        return;
      }
      case CheckType.CONTENT:
        evaluateContent(check, resultPath, resource.readText());
        return;
      case CheckType.JSON:
        evaluateJson(
          definition as JSONCheckDefinition,
          accumulator.matches,
          resultPath,
          resource.readJson()
        );
        return;
      case CheckType.YAML:
        evaluateYaml(
          definition as YAMLCheckDefinition,
          accumulator.matches,
          resultPath,
          resource.readYaml()
        );
        return;
      case CheckType.XPATH:
        evaluateXpath(
          definition as XPathCheckDefinition,
          accumulator.matches,
          resultPath,
          resource.readDom(
            Boolean(
              (definition as XPathCheckDefinition).xpathSanitizeAngularTemplate
            )
          )
        );
        return;
    }
  } catch (error) {
    accumulator.errors.push(
      createCheckFileError(definition, resultPath, error)
    );
    metrics.handledWarnings++;
  }
}

function evaluateContent(
  check: PreparedCheck,
  resultPath: string,
  content: string
) {
  const regexp = check.contentPattern!;
  const matchesForFile: RegExpExecArray[] = [];
  regexp.lastIndex = 0;

  if (regexp.global) {
    let match: RegExpExecArray | null;
    while ((match = regexp.exec(content)) !== null) {
      matchesForFile.push(match);
      if (match[0] === '') {
        regexp.lastIndex = advanceStringIndex(
          content,
          regexp.lastIndex,
          regexp.unicode
        );
      }
    }
  } else {
    const match = regexp.exec(content);
    if (match) {
      matchesForFile.push(match);
    }
  }
  regexp.lastIndex = 0;

  if (matchesForFile.length) {
    check.accumulator.matches.push({
      file: resultPath,
      matches: matchesForFile.map(
        (match) =>
          ({
            match: match[0],
            groups: match.groups,
          } as ProjectCheckMatchDetails)
      ),
    });
  }
}

function evaluateJson(
  definition: JSONCheckDefinition,
  matches: CheckAccumulatorMatches,
  resultPath: string,
  json: any
) {
  const path = definition.jsonPropertyPath?.startsWith('$')
    ? definition.jsonPropertyPath
    : `$${definition.jsonPropertyPath}`;
  const result = JSONPath({ path, json });

  if (result?.length) {
    matches.push({
      file: resultPath,
      matches: result.map((value: any) => ({
        match: definition.jsonPropertyPath,
        groups: {
          [definition.jsonPropertyPath]: value,
        },
      })),
    });
  }
}

function evaluateYaml(
  definition: YAMLCheckDefinition,
  matches: CheckAccumulatorMatches,
  resultPath: string,
  yaml: any
) {
  const result = readYamlPath(yaml, definition.yamlPropertyPath);

  if (result.length) {
    matches.push({
      file: resultPath,
      matches: [
        {
          match: definition.yamlPropertyPath,
          groups: {
            [definition.yamlPropertyPath]: result,
          },
        },
      ],
    });
  }
}

function evaluateXpath(
  definition: XPathCheckDefinition,
  matches: CheckAccumulatorMatches,
  resultPath: string,
  document: any
) {
  const namespaces =
    definition.xpathNamespaces?.reduce(
      (result, { prefix, uri }) => ({ ...result, [prefix]: uri }),
      {}
    ) ?? {};
  const xpathSelect = xpath.useNamespaces(namespaces);
  const result: any = xpathSelect(definition.xpathExpression, document);
  const resultMatches: any[] = [];

  if (typeof result === 'object' && Array.from(result as any[])?.length) {
    for (const node of Array.from(result as any[])) {
      const value =
        node?.nodeValue?.toString()?.trim() ||
        node?.textContent?.toString()?.trim();
      if (value) {
        const property =
          node.nodeName === '#text'
            ? node?.parentNode?.nodeName ?? node.nodeName
            : node.nodeName;
        resultMatches.push({
          match: resolveNodePath(node),
          lineNumber: node?.lineNumber,
          columnNumber: node?.columnNumber,
          groups: {
            [property]: value,
          },
        });
      }
    }
  }

  if (resultMatches.length) {
    matches.push({
      file: resultPath,
      matches: resultMatches,
    });
  }
}

type CheckAccumulatorMatches = PreparedCheck['accumulator']['matches'];

function finalizeCheck(check: PreparedCheck): ProjectCheck {
  const { definition, accumulator } = check;

  if (definition.type === CheckType.SIZE) {
    accumulator.sizeDetails.sort((left, right) => right.size - left.size);
    const total = accumulator.sizeDetails.reduce(
      (result, detail) => result + detail.size,
      0
    );
    return {
      name: definition.name,
      type: definition.type,
      value: accumulator.selectedFiles > 0,
      size: {
        total,
        totalHumanReadable: fs.getHumanReadableFileSize(total),
        details: accumulator.sizeDetails,
      },
    };
  }

  if (!accumulator.selectedFiles) {
    return {
      name: definition.name,
      type: definition.type,
      value: false,
    };
  }

  return {
    name: definition.name,
    type: definition.type,
    value:
      definition.type === CheckType.FILE
        ? true
        : accumulator.matches.length > 0,
    matches: accumulator.matches,
  };
}

function createCheckFileError(
  definition: CheckDefinition,
  file: string,
  error: unknown
): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (definition.type === CheckType.YAML) {
    return new Error(`[yaml] "${definition.name}" - ${file} - ${message}`);
  }

  return new Error(
    `[${definition.type}] "${definition.name}"\n   File: ${file}\n   Error: ${message}`
  );
}

function createCheckDirectoryError(
  definition: CheckDefinition,
  directory: string,
  error: unknown
): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(
    `[${definition.type}] "${definition.name}"\n   Directory: ${directory}\n   Error: ${message}`
  );
}

function resolveNodePath(originalNode: any) {
  let currentNode = originalNode;
  let path = originalNode.nodeName;

  while (
    (currentNode?.parentNode &&
      currentNode?.parentNode?.nodeName !== '#document') ||
    currentNode?.ownerElement
  ) {
    currentNode = currentNode?.parentNode ?? currentNode?.ownerElement;
    path = `${currentNode.nodeName} > ${path}`;
  }

  return path;
}

function advanceStringIndex(
  value: string,
  index: number,
  unicode: boolean
): number {
  if (!unicode || index >= value.length) {
    return index + 1;
  }

  const first = value.charCodeAt(index);
  if (first < 0xd800 || first > 0xdbff || index + 1 >= value.length) {
    return index + 1;
  }

  const second = value.charCodeAt(index + 1);
  return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

function getDefaultExcludeFilesPattern(ctx: Context, type: CheckType): string {
  if (type === CheckType.XPATH) {
    return (
      ctx.settings.analyzerExcludeFilesPatternXpath ||
      FALLBACK_EXCLUDE_FILES_PATTERN_XPATH
    );
  }
  if (type === CheckType.SIZE) {
    return (
      ctx.settings.analyzerExcludeFilesPatternSize ||
      FALLBACK_EXCLUDE_FILES_PATTERN_SIZE
    );
  }
  return (
    ctx.settings.analyzerExcludeFilesPatternContent ||
    FALLBACK_EXCLUDE_FILES_PATTERN_CONTENT
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

function getWarningPriority(type: CheckType): number {
  return type === CheckType.JSON || type === CheckType.YAML ? 1 : 0;
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
