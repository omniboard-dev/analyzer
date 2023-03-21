import { run } from './shell.service';

export function getRepoNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1].replace(/\.git$/, '');
}

export async function cloneRepo(url: string, targetDir: string) {
  return await run(`git clone --depth 1 ${url}`, targetDir);
}

export async function pullLatest(targetDir: string) {
  return await run(`git checkout --force && git pull --depth 1`, targetDir);
}
