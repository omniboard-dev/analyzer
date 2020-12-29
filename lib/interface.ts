export interface Options {
  verbose: boolean;
  json: boolean;
  jsonPath: string;
  errorsAsWarnings: boolean;
  apiKey?: string;
}

export interface Context {
  options: Options;
  definitions: {
    checks?: CheckDefinition[];
  };
  results: {
    name?: string;
    repository?: string;
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

export interface CheckDefinition {
  name: string;
  type: CheckType;
  disabled: boolean;
  filesPattern: string;
  filesPatternFlags?: string;
  filesExcludePattern?: string;
  filesExcludePatternFlags?: string;
  contentPattern: string;
  contentPatternFlags?: string;
  projectNamePattern?: string;
  projectNamePatternFlags?: string;
}

export enum CheckType {
  CONTENT = 'content',
  SIZE = 'size'
}
