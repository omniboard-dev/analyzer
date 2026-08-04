# Analyzer v3 streaming implementation plan

## Objective

Replace the check-major execution model with one bounded, file-major streaming
engine. Analyzer v3 has no legacy engine, compatibility switch, or fallback
execution path. Listr2 remains the CLI orchestrator and renderer, but does not
execute individual checks against the filesystem.

## Required behavioral contract

- Preserve the public `Context.results` check payloads for content, file, size,
  JSON, YAML, and XPath checks.
- Preserve disabled, metadata, project-name, and `--check-pattern` filtering.
- Preserve default and explicitly unset regular-expression flags.
- Preserve type-specific default exclusion patterns and custom overrides.
- Preserve named content captures and global/non-global matching.
- Preserve JSON comment/trailing-comma support, YAML path behavior, XPath
  namespaces, Angular-template sanitization, XML location metadata, and UTF-8
  BOM handling.
- Preserve per-file warning attribution and malformed structured-file recovery.
- Preserve `analyze`, `test-check`, and batch behavior, local JSON output,
  uploads and result-size limits, blocklisted-project handling,
  `--errors-as-warnings`, `--silent`, `--verbose`, `--show-check-subtasks`, and
  check execution timeouts.
- Preserve deterministic result and match ordering.

## Execution architecture

1. Resolve applicable definitions before filesystem work.
2. Compile file/content regular expressions once.
3. Group checks by fully resolved include/exclude selector.
4. Walk the union of eligible directory scopes once with `Dirent` entries.
5. Carry only selectors that remain eligible into each subtree.
6. For each file, determine all applicable checks in definition order.
7. Lazily load the file body once and lazily derive JSON, YAML, and DOM forms.
8. Build at most one DOM per XPath sanitizer variant.
9. Execute all applicable checks and append primitives to per-check
   accumulators.
10. Dispose the per-file body and parsed forms before visiting the next file.
11. Finalize results in original definition order and append handled warnings in
    stable check/file order.

The engine exposes progress snapshots and final operation metrics but imports no
Listr2 types. The Listr task adapter throttles interactive updates, emits
additional verbose metrics, stays quiet in silent mode, and optionally
renders completed per-check summary subtasks.

## Delivery order and gates

### 1. Characterization

- Add a deterministic fixture with overlapping selectors and every check type.
- Capture exact expected results, warnings, ordering, flags, encodings, and
  malformed-file behavior.
- Add operation spies so performance properties are testable without timing.
- Freeze local real-repository settings/check inputs and baseline output under
  `/tmp`; never commit fixture credentials or organization data.

Gate: the legacy implementation repeatedly produces the same normalized output.

### 2. Engine seam and planner

- Introduce streaming input/result/progress types.
- Resolve applicability and effective selector flags.
- Compile and group selectors and initialize per-check accumulators.

Gate: planned/skipped definitions and selector matches equal characterization
expectations.

### 3. Streaming filesystem and resources

- Add a deterministic one-pass `Dirent` walker.
- Add lazy, error-caching per-file text/JSON/YAML/DOM resources.
- Add progress/operation counters and periodic event-loop yielding.

Gate: one traversal; one body read per eligible file; bounded resource lifetime.

### 4. Evaluators

- Migrate file and size checks.
- Migrate content checks with zero-length global-regex protection.
- Migrate JSON and YAML checks with shared parsing.
- Migrate XPath checks with shared parser variants and location metadata.
- Finalize check payloads and handled warnings.

Gate: exact result and warning parity on the deterministic fixture.

### 5. Listr2 and command integration

- Replace per-check execution tasks with one streaming analysis task.
- Render throttled standard progress and periodic verbose metrics.
- Use completed result summaries for `--show-check-subtasks`.
- Preserve silent/non-TTY behavior and runner error handling.
- Exercise analyze, test-check, and batch context reset/finalization.

Gate: CLI/task tests and existing analyze/batch tests pass.

### 6. Robustness and performance verification

- Run formatting, TypeScript build, and the complete Vitest suite.
- Verify malformed files, inaccessible/disappearing files, BOMs, custom flags,
  blocklists, timeout failures, and `--errors-as-warnings`.
- Verify operation counts and memory under generated TypeScript/HTML and
  structured-file workloads.
- Run the packaged analyzer against the clean UI-components repository with
  JSON output under `/tmp` and compare the normalized result to the frozen v2
  baseline.
- Measure at least three comparable runs and report median end-to-end and check
  phase duration.

Gate: all tests/builds pass, real-project results match, and the check phase
meets the target without unbounded source retention.

## Initial acceptance targets

- One filesystem traversal per project analysis.
- No discovery-time `lstat` calls.
- One physical body read per file matched by any body-consuming check.
- One JSON/YAML parse per relevant file and one DOM parse per file/sanitizer
  variant.
- UI-components local check phase at or below 2.5 seconds in the profiled
  environment.
- UI-components full-run median between 7.5 and 9 seconds under comparable API
  conditions, approximately 6 to 7 seconds faster than the v2 median.
- Peak heap does not grow with total source bytes beyond result accumulation and
  traversal metadata.

## Out of scope

- Database changes.
- Branch creation, commits, pushes, or releases.
- Replacing Listr2.
- A second execution engine or permanent compatibility switch.
