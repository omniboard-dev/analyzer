export type ProjectAnalysisAction = 'analyze' | 'skip';
export type ProjectAnalysisOutcome = 'analyzed' | 'skipped' | 'failed';
export type ProjectSkipReason = 'unchanged' | 'excluded' | 'unresolved';

export type ProjectAnalysisResult =
  | { outcome: 'analyzed' }
  | { outcome: 'skipped'; reason: ProjectSkipReason }
  | { outcome: 'failed' };

export type ProjectAnalysisDecision =
  | {
      sourceKey: string;
      action: 'analyze';
    }
  | {
      sourceKey: string;
      action: 'skip';
      reason: 'unchanged';
    };

export interface SkippedProject {
  source: string;
  reason: ProjectSkipReason;
}

export interface ProjectAnalysisResultCounts {
  analyzed: number;
  skipped: number;
  skippedByReason: Record<ProjectSkipReason, number>;
  failed: number;
}
