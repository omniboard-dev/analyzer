import { findFiles, readJson, readXml } from './fs.service';

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
    .map(f => readJson(f).name)
    .filter(Boolean);
};

export const findProjectNamesMaven = async (): Promise<string[]> => {
  const poms = await Promise.all(findPomXmlFiles().map(f => readXml(f)));
  return poms.map(pom => pom.project.artifactId[0]);
};

export const findProjectRepositoriesNpm = () => {
  return Array.from(
    new Set(
      findPackageJsonFiles()
        .map(f => readJson(f)?.repository?.url)
        .filter(Boolean)
        .map(url => sanitizeRepositoryUrl(url))
    )
  );
};

export const findProjectRepositoriesMaven = async (): Promise<string[]> => {
  const poms = await Promise.all(findPomXmlFiles().map(f => readXml(f)));
  return Array.from(
    new Set(
      poms
        .map(pom => pom.project?.scm?.[0]?.url?.[0])
        .filter(Boolean)
        .map(url => sanitizeRepositoryUrl(url))
    )
  );
};

function findPackageJsonFiles() {
  return findFiles(
    'package.json',
    undefined,
    PROJECT_INFO_TASK_EXCLUDE_PATTERN,
    PROJECT_INFO_TASK_PATTERN_FLAGS
  );
}

function findPomXmlFiles() {
  return findFiles(
    'pom.xml',
    '',
    '.teamcity'
    // TODO what to exclude in java repo?
  );
}

function sanitizeRepositoryUrl(rawUrl: string) {
  return rawUrl
    .replace('git+', '')
    .replace('git@', 'https://')
    .replace(/(?<!https?):/gi, '/');
}
