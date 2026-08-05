import { ProjectAnalysisOutcome, ProjectSkipReason } from '../project-analysis';

export type BatchTelemetryStatus = 'success' | 'partial' | 'failed';
export type ProjectPlanningStatus =
  | 'not-run'
  | 'running'
  | 'completed'
  | 'unavailable';

export interface BatchTelemetryProjectDuration {
  projectName: string;
  durationMs: number;
  outcome: ProjectAnalysisOutcome;
  skipReason?: ProjectSkipReason;
}

export interface BatchTelemetryData {
  runId: string;
  invocationId: string;
  batchName: string;
  ciProvider: string;
  startedAt: string;
  durationMs: number;
  status: BatchTelemetryStatus;
  projectsQueued: number;
  planningStatus: ProjectPlanningStatus;
  planningDurationMs: number;
  projectsCheckedForChanges: number;
  projectsWithUnresolvedHead: number;
  projectsAnalyzed: number;
  projectsSkipped: number;
  projectsSkippedByReason: Record<ProjectSkipReason, number>;
  projectsFailed: number;
  slowestProjects: BatchTelemetryProjectDuration[];
  shardIndex?: number;
  shardCount?: number;
}

export interface BatchTelemetryRunContext {
  runId: string;
  ciProvider: string;
  shardIndex?: number;
  shardCount?: number;
}

export interface BatchTelemetryState extends BatchTelemetryRunContext {
  invocationId: string;
  batchName: string;
  startedAtMs: number;
  projectsQueued: number;
  planningStatus: ProjectPlanningStatus;
  planningStartedAt?: number;
  planningDurationMs: number;
  projectsCheckedForChanges: number;
  projectsWithUnresolvedHead: number;
  projectsAnalyzed: number;
  projectsSkippedByReason: Record<ProjectSkipReason, number>;
  projectsFailed: number;
  projectStartedAt: Map<string, number>;
  slowestProjects: BatchTelemetryProjectDuration[];
}
