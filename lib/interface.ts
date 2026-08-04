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
  settings: Settings;
  definitions: {
    checks?: CheckDefinition[];
  };
  results: {
    name?: string;
    team?: string[];
    projectSize?: ProjectSize;
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

export interface TeamResolver {
  type: string;
  filePattern: string;
  teamNamePattern: string;
  teamNameFlags?: string;
}

export interface Settings {
  customProjectResolvers?: CustomProjectResolver[];
  teamResolvers?: TeamResolver[] | null;
  projectsMaxLimit?: number;
  checkResultSizeLimit?: number;
  totalCheckResultSizeLimit?: number;
  projectsBlocklistPattern?: string;
  projectsBlocklistExplicit?: string[];
  // Legacy API field names retained for backwards compatibility.
  projectsBlacklistPattern?: string;
  projectsBlacklistExplicit?: string[];
  analyzerIncludeFilesFlag?: string;
  analyzerExcludeFilesPatternXpath?: string;
  analyzerExcludeFilesPatternContent?: string;
  analyzerExcludeFilesPatternSize?: string;
  analyzerExcludeFilesPatternFlags?: string;
  analyzerCheckExecutionTimeout?: number;
}

export interface ProjectSize {
  totalFiles: number;
  totalLines: number;
  byExtension: Record<string, number>;
  linesByExtension: Record<string, number>;
}

export interface ProjectInfo {
  name: string;
  names: string[];
  team?: string[];
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

export interface BaseCheckDefinition<TType extends CheckType = CheckType> {
  name: string;
  type: TType;
  disabled: boolean;
  filesPattern: string;
  filesPatternFlags?: string;
  filesExcludePattern?: string;
  filesExcludePatternFlags?: string;

  projectNamePattern?: string;
  projectNamePatternFlags?: string;
}

export interface ContentCheckDefinition
  extends BaseCheckDefinition<CheckType.CONTENT> {
  contentPattern: string;
  contentPatternFlags?: string;
}

export interface XPathCheckDefinition
  extends BaseCheckDefinition<CheckType.XPATH> {
  xpathExpression: string;
  xpathNamespaces?: { prefix: string; uri: string }[];
  xpathSanitizeAngularTemplate?: boolean;
}

export interface JSONCheckDefinition
  extends BaseCheckDefinition<CheckType.JSON> {
  jsonPropertyPath: string;
}

export interface YAMLCheckDefinition
  extends BaseCheckDefinition<CheckType.YAML> {
  yamlPropertyPath: string;
}

export interface FileCheckDefinition
  extends BaseCheckDefinition<CheckType.FILE> {}

export interface SizeCheckDefinition
  extends BaseCheckDefinition<CheckType.SIZE> {}

export interface MetaCheckDefinition
  extends BaseCheckDefinition<CheckType.META> {}

export type ExecutableCheckDefinition =
  | ContentCheckDefinition
  | XPathCheckDefinition
  | JSONCheckDefinition
  | YAMLCheckDefinition
  | FileCheckDefinition
  | SizeCheckDefinition;

export type CheckDefinition = ExecutableCheckDefinition | MetaCheckDefinition;

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
