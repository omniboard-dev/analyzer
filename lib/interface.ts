export interface Options {
  verbose: boolean;
  json: boolean;
  jsonPath: string;
  apiKey?: string;
}

export interface Context {
  options: Options;
  definitions: {
    checks?: CheckRegexp[];
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
  [key: string]: any;
}

export interface ProjectCheck {
  name: string;
  value: boolean;
  matches: ProjectCheckMatch[];
}

export interface ProjectCheckMatch {
  file: string;
  matches: ProjectCheckMatchDetails[];
}

export interface ProjectCheckMatchDetails {
  match: string;
  groups: { [key: string]: any }
}

export interface CheckRegexp {
  name: string;
  disabled: boolean;
  filesPattern: string;
  filesPatternFlags?: string;
  filesExcludePattern?: string;
  filesExcludePatternFlags?: string;
  contentPattern: string;
  contentPatternFlags?: string;
}
