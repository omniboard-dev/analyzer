<img src="https://app.omniboard.dev/assets/logo_email.png" height="50">

# @omniboard/analyzer

## Getting started with Omniboard in less than 5 minutes (video)

<a href="https://omniboard.dev/omniboard-getting-started.mp4" target="_blank">
    <img src="https://omniboard.dev/omniboard-getting-started.png" height="300" />
</a>

### Create account, get API key and define checks

1. Create free account for [Omniboard.dev](https://www.omniboard.dev)
2. Generate API key in the [Omniboard.dev](https://app.omniboard.dev/app/api-keys) ([docs](https://www.omniboard.dev/docs#api-key))
3. Set API key as an `OMNIBOARD_API_KEY` environment variable (or pass it in using `--api-key` flag when running `omniboard` command, never commit your API key to the version control system)
4. (optional) test your API key using `npx omniboard test-connection --api-key <your-api-key>` (same as `omniboard tc --ak <your-api-key>`)
5. Define checks in the [Omniboard.dev](https://app.omniboard.dev/app/checks) app

### Run in projects

Make sure you have already set `OMNIBOARD_API_KEY` environment variable in the given environment (CI) or pass it in using `--api-key` flag when running `omniboard` command locally

1. install it using `npm i -D @omniboard/analyzer` in the project we want to analyze (dev dependency)
2. run it using `npx omniboard` (or run `omniboard` as a npm script, eg `"postbuild": "omniboard""`)

or

- `npx @omniboard/analyzer` (in case it was not pre-installed)

or

- `npm i -g @omniboard/analyzer` - install it globally to be able to run `omniboard` in any path without waiting for npx install

## Commands

- `omniboard analyze` - (same as `omniboard`) analyze project and upload results to Omniboard.dev, or store results locally with `--json`
- `omniboard batch` - Clone (or update) and analyze multiple project repositories and upload results to Omniboard.dev, or store results locally with `--json`
- `omniboard test-connection` - test connection to the Omniboard.dev app
- `omniboard test-check` - test check definition provided as a CLI argument (can be copied from the Omniboard.dev app)

## How it works - analyze

1. retrieve current checks defined in the Omniboard.dev app
2. run retrieved checks for the current project (skip checks that are disabled or if project name does not match provided pattern)
3. store check results locally when `--json` flag was present
4. upload checks results to the Omniboard.dev app when `--json` is not present and `OMNIBOARD_API_KEY` env variable or `--api-key` flag is present
5. Explore results in the Omniboard.dev app using projects, results or dashboards overview

## How it works - batch

### Setup

1. on the first run, create empty workspace and job file (if not present)
2. (manual step) add repository urls to the job file (in `queue` array)

### Execution

1. batch will clone (or update) repository from the queue
2. batch will run `omniboard analyze` in the cloned repository
3. batch will remove repository from the queue into `done` array (or `failed` array in case of error), you can use `--preserve-queue` flag to enable multiple runs of the same job file
4. batch will repeat steps 1-3 until every repository from the queue is processed

## Global options

Run `omniboard --help` for list of all supported commands and options (`omniboard <command> --help`, provides even more details)

- `--help` - print help
- `--verbose` - print debug log statements
- `--silent` - silences the renderer
- `--show-check-subtasks` - Show checks subtasks in log output (collapsed by default)
- `--errors-as-warnings` - exit with success (0) even in case of errors and log them as warnings (useful for CI)
- `--api-key` - pass in API key when not set as an environment variable
- `--api-url` - pass in URL of the on-prem Omniboard instance (for custom enterprise plans only)
- `--json` - store data in local json file and skip upload
- `--json-path` - location of local json file
- `--check-pattern` - only run checks matching provided pattern
- `--sanitize-repo-url` - try to sanitize auth tokens from repo urls

## Analyzer v3 streaming execution

Analyzer v3 executes checks file-by-file in one bounded-memory traversal. Checks
with the same include and exclude patterns share a selector bucket. An eligible
file is read once, then its text and lazily parsed JSON, YAML, or XML resources
are reused by every applicable check before being released. No project-wide
source or parsed-document cache is retained.

This preserves the established check result schema, file ordering, filtering,
handled-warning behavior, UTF-8/XML BOM handling, Angular template XPath
sanitization, JSON comments and trailing commas, YAML paths, batch behavior, and
upload-size enforcement. The implementation plan and acceptance gates are in
[`docs/analyzer-v3-streaming-plan.md`](docs/analyzer-v3-streaming-plan.md).

Listr2 remains the CLI renderer, with a single streaming analysis task:

- Standard mode shows live files visited, eligible files, physical reads,
  evaluations, bytes read, and throughput.
- `--verbose` adds directory progress, warning count, current source bytes in
  flight, and the current directory with less frequent updates.
- `--silent` emits no successful progress output. Fatal and handled warnings
  remain observable according to `--errors-as-warnings`.
- `--show-check-subtasks` prints completed per-check summaries after the stream;
  it does not create one concurrently running task per check.

Memory usage scales with definitions, result matches, directory metadata, and
the largest currently processed file—not with the total source size of the
project. Result matches necessarily remain in memory until serialization or
upload because they are the analyzer output.

## FAQ

#### Is it possible to run @omniboard/analyzer behind organization proxy?

**Yes**

The `@omniboard/analyzer` uses [global-agent](https://github.com/gajus/global-agent) library which will uses
`HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables and use them to make requests
to `https://api.omniboard.dev`

#### Is this uploading my source code to the cloud?

**No**

The `@omniboard/analyzer` runs checks against your source code (or even generated artifacts)
and uploads results of these checks to the cloud service for further processing.
The uploaded content is then just metadata describing the projects and results but NOT the projects themselves.

In theory, a check which matches everything could be constructed but such result will
be rejected as the payload would be too large. The limits of how much data can be stored
per check and per all checks for a project can be customized in organization settings in the Omniboard.dev app.
