import xpath from 'xpath';

import { CustomProjectResolver } from '../interface';
import {
  findFiles,
  readJson,
  readXmlAsDom,
  readFile,
  currentFolderName,
} from './fs.service';

const PROJECT_INFO_TASK_EXCLUDE_PATTERN = '(^\\.|node_modules|coverage|dist)';
const PROJECT_INFO_TASK_PATTERN_FLAGS = 'i';

export const isMavenWorkspace = (): boolean => {
  return !!findPomXmlFiles()?.length;
};

export const isNpmWorkspace = (): boolean => {
  return !!findPackageJsonFiles()?.length;
};

export const isPipWorkspace = (): boolean => {
  return !!findSetupPyFiles()?.length;
};

export const findProjectNamesNpm = (): string[] => {
  return findPackageJsonFiles()
    .map((f) => readJson(f)?.name)
    .filter(Boolean);
};

export const findProjectNamesMaven = (): string[] => {
  return findPomXmlFiles()
    .map((f) => readXmlAsDom(f))
    .filter(Boolean)
    .map(
      (document) =>
        xpath
          .select(
            'string(//*[local-name()="project"]/*[local-name()="artifactId"])',
            document!,
            true
          )
          ?.toString() || ''
    )
    .filter(Boolean);
};

export const findProjectNamesPip = (): string[] => {
  return Array.from(
    new Set(
      findSetupPyFiles()
        .map((f) => readFile(f))
        .map((content) => /name=\s?"(?<name>.*)"/.exec(content)?.groups?.name!)
        .filter(Boolean)
    )
  );
};

export const findProjectNamesRepo = (): string[] => {
  return [currentFolderName()];
};

export const findProjectRepositoriesNpm = (sanitizeRepoUrl: boolean) => {
  return Array.from(
    new Set(
      findPackageJsonFiles()
        .map((f) => readJson(f)?.repository?.url)
        .filter(Boolean)
        .map((url) => sanitizeRepositoryUrl(url, sanitizeRepoUrl))
    )
  );
};

export const findProjectRepositoriesMaven = (
  sanitizeRepoUrl: boolean
): string[] => {
  return Array.from(
    new Set(
      findPomXmlFiles()
        .map((f) => readXmlAsDom(f))
        .filter(Boolean)
        .flatMap((document) =>
          xpath.select(
            'string(//*[local-name()="project"]/*[local-name()="scm"]/*[local-name()="connection" or local-name()="developerConnection"][last()])',
            document!,
            true
          )
        )
        .filter(Boolean)
        .map((url) => sanitizeRepositoryUrl(url!.toString(), sanitizeRepoUrl))
    )
  );
};

export const findProjectRepositoriesRepo = (
  sanitizeRepoUrl: boolean
): string[] => {
  const gitConfigPath = findFiles('.git/config')[0];
  if (!gitConfigPath) {
    return [];
  }
  const gitConfig = readFile(gitConfigPath);
  const repoUrl = /\[remote.?["']origin["']\]\n\s*url\s?=\s?(?<url>.*)/.exec(
    gitConfig
  )?.groups?.url;
  if (repoUrl && repoUrl.length) {
    return [sanitizeRepositoryUrl(repoUrl, sanitizeRepoUrl)];
  } else {
    return [];
  }
  return [];
};

function findPackageJsonFiles() {
  return findFiles(
    'package.json',
    'i',
    PROJECT_INFO_TASK_EXCLUDE_PATTERN,
    PROJECT_INFO_TASK_PATTERN_FLAGS
  );
}

function findPomXmlFiles() {
  return findFiles(
    'pom.xml',
    'i',
    '.teamcity' // TODO what else to exclude in java repo?
  );
}

function findSetupPyFiles() {
  return findFiles(
    'setup.py',
    'i',
    PROJECT_INFO_TASK_EXCLUDE_PATTERN,
    PROJECT_INFO_TASK_PATTERN_FLAGS
  );
}

export const findProjectNameCustomProjectResolver = (
  customProjectResolver: CustomProjectResolver
): string[] => {
  return Array.from(
    new Set(
      findFiles(
        customProjectResolver.filePattern,
        PROJECT_INFO_TASK_PATTERN_FLAGS,
        PROJECT_INFO_TASK_EXCLUDE_PATTERN,
        PROJECT_INFO_TASK_PATTERN_FLAGS
      )
    )
  )
    .map((f) => readFile(f))
    .map(
      (content) =>
        new RegExp(customProjectResolver.projectNamePattern, 'i').exec(content)
          ?.groups?.projectName!
    )
    .filter(Boolean);
};

function sanitizeRepositoryUrl(rawUrl: string, sanitizeRepoUrl: boolean) {
  let sanitizedUrl = rawUrl
    .replace(/^scm:.*?:/gi, '') // remove maven scm prefix
    .replace('git+', '')
    .replace('git@', 'https://')
    .replace(/(?<!https?):/gi, '/');

  if (sanitizeRepoUrl && sanitizedUrl.includes('@')) {
    const [, url] = sanitizedUrl.split('@');
    let [domainName, ...path] = url.split('/');
    if (domainName.includes('gitlab')) {
      domainName = 'gitlab.com';
    }
    if (domainName.includes('github')) {
      domainName = 'github.com';
    }
    return `https://${domainName}/${path.join('/')}`;
  }

  return sanitizedUrl;
}
