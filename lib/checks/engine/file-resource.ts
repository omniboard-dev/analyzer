import stripJsonComments from 'strip-json-comments';
import stripJsonTrailingCommas from 'strip-json-trailing-commas';
import YAML from 'yaml';

import * as fs from '../../services/fs.service';

import { StreamingCheckMetrics } from './types';

type Attempt<T> = { value: T } | { error: unknown };

function resolveAttempt<T>(attempt: Attempt<T>): T {
  if ('error' in attempt) {
    throw attempt.error;
  }
  return attempt.value;
}

export class FileResource {
  private textAttempt?: Attempt<string>;
  private jsonAttempt?: Attempt<any>;
  private yamlAttempt?: Attempt<any>;
  private readonly domAttempts = new Map<boolean, Attempt<any>>();

  constructor(
    readonly path: string,
    private readonly metrics: StreamingCheckMetrics,
    private readonly verbose: boolean
  ) {}

  readText(): string {
    if (!this.textAttempt) {
      try {
        const value = fs.readFile(this.path);
        const size = Buffer.byteLength(value, 'utf8');
        this.metrics.filesRead++;
        this.metrics.bytesRead += size;
        this.metrics.currentInFlightBytes = size;
        this.metrics.peakInFlightBytes = Math.max(
          this.metrics.peakInFlightBytes,
          size
        );
        this.textAttempt = { value };
      } catch (error) {
        this.textAttempt = { error };
      }
    }
    return resolveAttempt(this.textAttempt);
  }

  readJson(): any {
    if (!this.jsonAttempt) {
      try {
        this.metrics.jsonParses++;
        this.jsonAttempt = {
          value: JSON.parse(
            stripJsonTrailingCommas(stripJsonComments(this.readText()))
          ),
        };
      } catch (error) {
        this.jsonAttempt = { error };
      }
    }
    return resolveAttempt(this.jsonAttempt);
  }

  readYaml(): any {
    if (!this.yamlAttempt) {
      try {
        this.metrics.yamlParses++;
        this.yamlAttempt = {
          value: YAML.parse(this.readText(), { strict: false }),
        };
      } catch (error) {
        this.yamlAttempt = { error };
      }
    }
    return resolveAttempt(this.yamlAttempt);
  }

  readDom(xpathSanitizeAngularTemplate: boolean): any {
    let attempt = this.domAttempts.get(xpathSanitizeAngularTemplate);
    if (!attempt) {
      try {
        this.metrics.domParses++;
        attempt = {
          value: fs.parseXmlAsDom(this.readText(), {
            xpathSanitizeAngularTemplate,
            verbose: this.verbose,
          }),
        };
      } catch (error) {
        attempt = { error };
      }
      this.domAttempts.set(xpathSanitizeAngularTemplate, attempt);
    }
    return resolveAttempt(attempt);
  }

  dispose() {
    this.textAttempt = undefined;
    this.jsonAttempt = undefined;
    this.yamlAttempt = undefined;
    this.domAttempts.clear();
    this.metrics.currentInFlightBytes = 0;
  }
}
