export interface Options {
  verbose: boolean;
  json: boolean;
  jsonPath: string;
  errorsAsWarnings: boolean;
  checkPattern?: string;
  apiKey?: string;
}

export interface Context {
  options: Options;
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
  processedResults?: any;
}

export interface ProjectInfo {
  name: string;
  names: string[];
  type?: ProjectType;
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
}

export enum CheckType {
  CONTENT = 'content',
  XPATH = 'xpath',
  SIZE = 'size',
  META = 'meta'
}

export enum ProjectType {
  NPM = 'npm',
  MAVEN = 'MAVEN'
}
