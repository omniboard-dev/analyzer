import { Context } from '../../interface';
import { reportFinishedBatch } from '../../services/analyzer-telemetry.service';
import { RunnerOutcome } from '../../utils/process';

import { createBatchTelemetryData } from './state';

export async function reportBatchTelemetry(
  ctx: Context,
  outcome: RunnerOutcome
): Promise<void> {
  await reportFinishedBatch(ctx, createBatchTelemetryData(ctx, outcome));
}
