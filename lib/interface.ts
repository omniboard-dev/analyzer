export interface Options {
  //process
  errorsAsWarnings: boolean;

  // logging
  silent: boolean;
  verbose: boolean;
  showCheckSubtasks: boolean;

  // results as local json
  json: boolean;
  jsonPath: string;

  // api
  apiUrl?: string;
  apiKey?: string;

  // analysis and checks
  checkPattern?: string;
  checkDefinition?: string;

  // security
  sanitizeRepoUrl: boolean;

  // batch
  jobPath: string;
  workspacePath: string;
  preserveQueue: boolean;
}

export interface Context {
  options: Options;
  control: {
    skipEverySubsequentTask: boolean;
  };
  settings: {
    customProjectResolvers?: CustomProjectResolver[];
    projectsMaxLimit?: number;
    checkResultSizeLimit?: number;
    totalCheckResultSizeLimit?: number;
    projectsBlacklistPattern?: string;
    projectsBlacklistExplicit?: string[];
  };
  definitions: {
    checks?: (ContentCheckDefinition | XPathCheckDefinition)[];
  };
  results: {
    name?: string;
    info?: ProjectInfo;
    checks?: {
      [key: string]: ProjectCheck;
    };
  };
  handledCheckFailures: Error[];
  batch: Batch;
  debug: {
    [key: string]: any;
  };
}

export interface Batch {
  queue: string[];
  completed: string[];
  failed: string[];
}

export interface CustomProjectResolver {
  type: string;
  filePattern: string;
  projectNamePattern: string;
}

export interface ProjectInfo {
  name: string;
  names: string[];
  type?: ProjectType | string;
  repository?: string;
  repositories?: string[];
  [key: string]: any;
}

export interface ProjectCheck {
  name: string;
  type: CheckType;
  value: boolean;
  matches?: ProjectCheckMatch[];
  size?: ProjectCheckSize;
}

export interface ProjectCheckMatch {
  file: string;
  matches: ProjectCheckMatchDetails[];
}

export interface ProjectCheckSize {
  total: number;
  totalHumanReadable: string;
  details: ProjectCheckSizeDetails[];
}

export interface ProjectCheckSizeDetails {
  file: string;
  size: number;
  sizeHumanReadable: string;
}

export interface ProjectCheckMatchDetails {
  match: string;
  groups: { [key: string]: any };
}

export interface BaseCheckDefinition {
  name: string;
  type: CheckType;
  disabled: boolean;
  filesPattern: string;
  filesPatternFlags?: string;
  filesExcludePattern?: string;
  filesExcludePatternFlags?: string;
  projectNamePattern?: string;
  projectNamePatternFlags?: string;
}

export interface ContentCheckDefinition extends BaseCheckDefinition {
  contentPattern: string;
  contentPatternFlags?: string;
}

export interface XPathCheckDefinition extends BaseCheckDefinition {
  xpathExpression: string;
  xpathNamespaces?: { prefix: string; uri: string }[];
  xpathSanitizeAngularTemplate?: boolean;
}

export interface JSONCheckDefinition extends BaseCheckDefinition {
  jsonPropertyPath: string;
}

export interface YAMLCheckDefinition extends BaseCheckDefinition {
  yamlPropertyPath: string;
}

export enum CheckType {
  CONTENT = 'content',
  XPATH = 'xpath',
  SIZE = 'size',
  META = 'meta',
  FILE = 'file',
  JSON = 'json',
  YAML = 'yaml',
}

export enum ProjectType {
  NPM = 'npm',
  MAVEN = 'MAVEN',
  PIP = 'pip',
  REPO = 'repo',
}

export interface ParentTask {
  title: string;
}
