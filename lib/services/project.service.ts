import xpath from 'xpath';
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

export const findProjectRepositoriesNpm = () => {
  return Array.from(
    new Set(
      findPackageJsonFiles()
        .map((f) => readJson(f)?.repository?.url)
        .filter(Boolean)
        .map((url) => sanitizeRepositoryUrl(url))
    )
  );
};

export const findProjectRepositoriesMaven = (): string[] => {
  return Array.from(
    new Set(
      findPomXmlFiles()
        .map((f) => readXmlAsDom(f))
        .filter(Boolean)
        .flatMap((document) =>
          xpath.select(
            'string(//*[local-name()="project"]/*[local-name()="scm"]/*[local-name()="url"])',
            document!,
            true
          )
        )
        .filter(Boolean)
        .map((url) => sanitizeRepositoryUrl(url!.toString()))
    )
  );
};

export const findProjectRepositoriesRepo = (): string[] => {
  const gitConfigPath = findFiles('.git/config')[0];
  const gitConfig = readFile(gitConfigPath);
  const repoUrl = /url\s?=\s?(?<url>.*)/.exec(gitConfig)?.groups?.url;
  if (repoUrl && repoUrl.length) {
    return [repoUrl];
  } else {
    return [];
  }
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

function sanitizeRepositoryUrl(rawUrl: string) {
  return rawUrl
    .replace('git+', '')
    .replace('git@', 'https://')
    .replace(/(?<!https?):/gi, '/');
}

export const findProjectNamesRepo = (): string[] => {
  return [currentFolderName()];
};
