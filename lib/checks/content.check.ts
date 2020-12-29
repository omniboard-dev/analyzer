import { ListrTaskWrapper, ListrDefaultRenderer } from 'listr2';
import {
  CheckDefinition,
  Context,
  ProjectCheckMatch,
  ProjectCheckMatchDetails
} from '../interface';
import * as fs from '../services/fs.service';

const DEFAULT_EXCLUDE_PATTERN = '(^\\.|node_modules|coverage|dist)';
const DEFAULT_EXCLUDE_PATTERN_FLAGS = 'i';

export function contentCheckTaskFactory(definition: CheckDefinition) {
  async function contentCheckTask(
    ctx: Context,
    task: ListrTaskWrapper<Context, ListrDefaultRenderer>
  ) {
    const {
      name,
      type,
      filesPattern,
      filesPatternFlags,
      filesExcludePattern,
      filesExcludePatternFlags,
      contentPattern,
      contentPatternFlags
    } = definition;
    const files = fs.findFiles(
      filesPattern,
      filesPatternFlags,
      filesExcludePattern || DEFAULT_EXCLUDE_PATTERN,
      filesExcludePatternFlags || DEFAULT_EXCLUDE_PATTERN_FLAGS
    );
    task.title = `${task.title}, found ${files.length} files`;

    const matches: ProjectCheckMatch[] = [];
    for (const file of files) {
      const content = fs.readFile(file);

      const regexp = new RegExp(contentPattern, contentPatternFlags || 'ig');
      // const matchesForFile = [...(content as any).matchAll(regexp)]; // TODO node v12+
      const matchesForFile = [];
      let match;
      while ((match = regexp.exec(content)) !== null) {
        matchesForFile.push(match);
      }
      if (matchesForFile?.length) {
        matches.push({
          file,
          matches: matchesForFile.map(
            m =>
              ({
                match: m[0],
                groups: m.groups
              } as ProjectCheckMatchDetails)
          )
        });
      }
    }
    ctx.results.checks![name] = {
      name,
      type,
      value: matches.length > 0,
      matches
    };
  }
  return contentCheckTask;
}
