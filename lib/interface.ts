export interface Options {
  verbose: boolean;
  json: boolean;
  jsonPath: string;
  apiKey?: string;
}

export interface Context {
  options: Options;
  definitions: {
    checks?: RegexpProjectCheckDefinition[];
  };
  results: {
    info?: ProjectInfo;
    checks?: {
      [key: string]: ProjectCheck;
    };
  };
  processedResults?: any;
}

export interface ProjectCheck {
  name: string;
  value: boolean;
  matches: string[] | null;
}

export interface ProjectInfo {
  name: string;
  names: string[];
  [key: string]: any;
}

export interface RegexpProjectCheckDefinition {
  name: string;
  filesPattern: string;
  filesPatternFlags?: string;
  filesExcludePattern?: string;
  filesExcludePatternFlags?: string;
  contentPattern: string;
  contentPatternFlags?: string;
}
