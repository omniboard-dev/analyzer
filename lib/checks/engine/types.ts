import {
  CheckDefinition,
  ExecutableCheckDefinition,
  ProjectCheck,
  ProjectCheckMatch,
  ProjectCheckSizeDetails,
} from '../../interface';

import type { AnyCheckHandler } from './check-handler';

export { CheckDefinition };

export interface CheckAccumulator {
  selectedFiles: number;
  matches: ProjectCheckMatch[];
  sizeDetails: ProjectCheckSizeDetails[];
  errors: Error[];
  elapsedMs: number;
}

export interface PreparedCheck {
  ordinal: number;
  definition: ExecutableCheckDefinition;
  handler: AnyCheckHandler;
  handlerState: unknown;
  accumulator: CheckAccumulator;
}

export interface SkippedCheck {
  ordinal: number;
  definition: CheckDefinition;
  reason: string;
}

export interface StreamingCheckMetrics {
  directoriesVisited: number;
  directoryEntries: number;
  filesVisited: number;
  directoryErrors: number;
  eligibleFiles: number;
  logicalCheckFileMatches: number;
  evaluationsCompleted: number;
  filesRead: number;
  bytesRead: number;
  statCalls: number;
  jsonParses: number;
  yamlParses: number;
  domParses: number;
  handledWarnings: number;
  currentInFlightBytes: number;
  peakInFlightBytes: number;
  startedAt: number;
  elapsedMs: number;
  currentDirectory?: string;
}

export interface StreamingCheckProgress extends StreamingCheckMetrics {
  phase: 'preparing' | 'walking' | 'finalizing';
}

export interface CheckExecutionSummary {
  definition: CheckDefinition;
  result?: ProjectCheck;
  errors: Error[];
  skippedReason?: string;
}

export interface StreamingCheckEngineResult {
  results: Record<string, ProjectCheck>;
  summaries: CheckExecutionSummary[];
  metrics: StreamingCheckMetrics;
}

export interface StreamingCheckEngineOptions {
  root?: string;
  signal?: AbortSignal;
  onProgress?: (progress: StreamingCheckProgress) => void;
  verbose?: boolean;
  yieldEvery?: number;
}
