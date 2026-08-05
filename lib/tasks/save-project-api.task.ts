import chalk from 'chalk';
import { ListrTask } from 'listr2';

import { recordCompletedAnalysis } from '../batch/skip-unchanged';
import * as api from '../services/api.service';
import { Context } from '../interface';
import { getHumanReadableFileSize } from '../services/fs.service';
import {
  prepareProjectResultsForUpload,
  RejectedCheckResult,
} from '../services/project-results-upload.service';
import { reportCompletedAnalysis } from '../services/analyzer-telemetry.service';

function getRejectedCheckResultMessage({
  name,
  size,
  limit,
  reason,
}: RejectedCheckResult) {
  const sizeText = getHumanReadableFileSize(size);
  const limitText = getHumanReadableFileSize(limit);

  return reason === 'per-check'
    ? `Check result "${name}" (${sizeText}) exceeds the per-check upload limit (${limitText})`
    : `Check result "${name}" (${sizeText}) must be omitted to keep the combined check results within the upload limit (${limitText})`;
}

function createProjectUploadSizeError(
  rejectedCheckResults: RejectedCheckResult[]
) {
  const resultText = rejectedCheckResults.length === 1 ? 'result' : 'results';
  const details = rejectedCheckResults
    .map((result) => `- ${getRejectedCheckResultMessage(result)}`)
    .join('\n');

  return new Error(
    `Project results upload aborted because ${rejectedCheckResults.length} check ${resultText} cannot be uploaded within the configured size limits:\n${details}\nRun again with --errors-as-warnings to omit oversized check results and upload the remaining results.`
  );
}

export const saveProjectApiTask: ListrTask = {
  title: 'Save project results (Omniboard.dev)',
  skip: (ctx: Context) => {
    if (ctx.control.skipEverySubsequentTask) {
      return true;
    }
    if (ctx.options.json) {
      return `Local json output requested, skipping Omniboard.dev upload`;
    }
    if (!process.env.OMNIBOARD_API_KEY && !ctx.options.apiKey) {
      ctx.control.skipEverySubsequentTask = true;
      return `Please provide --api-key argument or OMNIBOARD_API_KEY env variable`;
    } else {
      return false;
    }
  },
  task: async (ctx, task) => {
    if (ctx.control.skipEverySubsequentTask) {
      return;
    }

    const { results, rejectedCheckResults } = prepareProjectResultsForUpload(
      ctx.results,
      ctx.settings
    );

    if (rejectedCheckResults.length && !ctx.options.errorsAsWarnings) {
      throw createProjectUploadSizeError(rejectedCheckResults);
    }

    if (rejectedCheckResults.length) {
      ctx.handledCheckFailures.push(
        ...rejectedCheckResults.map(
          (result) =>
            new Error(
              `${getRejectedCheckResultMessage(
                result
              )} and was omitted from the upload`
            )
        )
      );
    }

    return api.uploadProject(results).then(async () => {
      await recordCompletedAnalysis(ctx, results.name);
      await reportCompletedAnalysis(ctx);
      const resultsLength = Buffer.byteLength(JSON.stringify(results), 'utf8');
      task.title = `${task.title} successful, ${getHumanReadableFileSize(
        resultsLength
      )}${
        rejectedCheckResults.length
          ? chalk.yellow.bold(
              ` - ⚠️ ${rejectedCheckResults.length} oversized check result${
                rejectedCheckResults.length === 1 ? '' : 's'
              } omitted`
            )
          : ''
      }`;
    });
  },
};
