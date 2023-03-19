import cp from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(cp.exec);
const MAX_BUFFER_SIZE = 1 * 1024 * 1024;

export async function run(
  command: string,
  targetDir: string
): Promise<CommandResult> {
  return await execAsync(command, {
    cwd: targetDir,
    maxBuffer: MAX_BUFFER_SIZE,
  });
}

export interface CommandResult {
  stdout: string;
  stderr: string;
}
