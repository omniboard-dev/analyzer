import type {
  Context,
  ExecutableCheckDefinition,
  ProjectCheck,
} from '../../interface';

import type { FileResource } from './file-resource';
import type { CheckAccumulator, StreamingCheckMetrics } from './types';

const FALLBACK_EXCLUDE_FILES_PATTERN_XPATH =
  '((^|\\/)\\.|node_modules|coverage|dist|.teamcity)';
const FALLBACK_EXCLUDE_FILES_PATTERN_CONTENT =
  '((^|\\/)\\.|node_modules|coverage|dist)';
const FALLBACK_EXCLUDE_FILES_PATTERN_SIZE = 'node_modules';

export interface CheckHandlerEvaluation<
  TDefinition extends ExecutableCheckDefinition,
  TPrepared
> {
  definition: TDefinition;
  prepared: TPrepared;
  resultPath: string;
  resource: FileResource;
  accumulator: CheckAccumulator;
  metrics: StreamingCheckMetrics;
}

export interface CheckHandlerFinalization<
  TDefinition extends ExecutableCheckDefinition
> {
  definition: TDefinition;
  accumulator: CheckAccumulator;
}

export interface CheckHandler<
  TDefinition extends ExecutableCheckDefinition,
  TPrepared = undefined
> {
  readonly type: TDefinition['type'];
  readonly hasExecutionTimeout: boolean;
  readonly warningPriority: number;
  getDefaultExcludePattern(ctx: Context): string;
  prepare(definition: TDefinition, ctx: Context): TPrepared;
  evaluate(input: CheckHandlerEvaluation<TDefinition, TPrepared>): void;
  finalize(input: CheckHandlerFinalization<TDefinition>): ProjectCheck;
  formatFileError?(
    definition: TDefinition,
    file: string,
    error: unknown
  ): Error;
}

export type AnyCheckHandler = CheckHandler<any, any>;

export function getDefaultContentExcludePattern(ctx: Context): string {
  return (
    ctx.settings.analyzerExcludeFilesPatternContent ||
    FALLBACK_EXCLUDE_FILES_PATTERN_CONTENT
  );
}

export function getDefaultXpathExcludePattern(ctx: Context): string {
  return (
    ctx.settings.analyzerExcludeFilesPatternXpath ||
    FALLBACK_EXCLUDE_FILES_PATTERN_XPATH
  );
}

export function getDefaultSizeExcludePattern(ctx: Context): string {
  return (
    ctx.settings.analyzerExcludeFilesPatternSize ||
    FALLBACK_EXCLUDE_FILES_PATTERN_SIZE
  );
}

export function finalizeMatchCheck(
  definition: ExecutableCheckDefinition,
  accumulator: CheckAccumulator,
  matchWhenSelected = false
): ProjectCheck {
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
    value: matchWhenSelected || accumulator.matches.length > 0,
    matches: accumulator.matches,
  };
}

export function formatDefaultFileError(
  definition: ExecutableCheckDefinition,
  file: string,
  error: unknown
): Error {
  return new Error(
    `[${definition.type}] "${
      definition.name
    }"\n   File: ${file}\n   Error: ${resolveErrorMessage(error)}`
  );
}

export function resolveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
