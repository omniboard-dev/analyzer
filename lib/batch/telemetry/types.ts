export type BatchTelemetryStatus = 'success' | 'partial' | 'failed';
export type BatchJobStatus = 'succeeded' | 'failed' | 'skipped';
export type CachePlanningStatus =
  | 'not-run'
  | 'running'
  | 'completed'
  | 'unavailable';

export interface BatchTelemetryProjectDuration {
  projectName: string;
  durationMs: number;
  status: BatchJobStatus;
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
  cachePlanningStatus: CachePlanningStatus;
  cachePlanningDurationMs: number;
  cacheCheckedProjects: number;
  cacheHitProjects: number;
  unresolvedHeadProjects: number;
  jobsStarted: number;
  jobsSucceeded: number;
  jobsFailed: number;
  jobsSkipped: number;
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
  cachePlanningStatus: CachePlanningStatus;
  cachePlanningStartedAt?: number;
  cachePlanningDurationMs: number;
  cacheCheckedProjects: number;
  cacheHitProjects: number;
  unresolvedHeadProjects: number;
  jobsStarted: number;
  jobsSucceeded: number;
  jobsFailed: number;
  jobsSkipped: number;
  jobStartedAt: Map<string, number>;
  slowestProjects: BatchTelemetryProjectDuration[];
}
