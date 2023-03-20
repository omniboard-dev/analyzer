# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.23.0](https://github.com/omniboard-dev/analyzer/compare/v2.22.0...v2.23.0) (2023-03-20)


### Features

* **batch:** add batch capability ([a57068d](https://github.com/omniboard-dev/analyzer/commit/a57068d2754dcb048d33b41cb93d2aa4eea16397))
* **batch:** batch feature skeleton ([237fa06](https://github.com/omniboard-dev/analyzer/commit/237fa06c9fb297da0b875d17758cce676062ddbd))
* **handle-check-failure:** extract as separate task (from process) ([1d1aa91](https://github.com/omniboard-dev/analyzer/commit/1d1aa915f6f3583654c002c6cf5399126cb5a8a9))

## [2.22.0](https://github.com/omniboard-dev/analyzer/compare/v2.21.0...v2.22.0) (2023-01-15)


### Features

* **project-info:** add custom project resolvers support ([adbeccd](https://github.com/omniboard-dev/analyzer/commit/adbeccd4a4450f0986ede52c50931b0923bd3552))

## [2.21.0](https://github.com/omniboard-dev/analyzer/compare/v2.20.2...v2.21.0) (2023-01-03)


### Features

* **project-info:** sanitize tokens from repo url ([19864b0](https://github.com/omniboard-dev/analyzer/commit/19864b05b133852fda1387634de481f8ae715eb8))

### [2.20.2](https://github.com/omniboard-dev/analyzer/compare/v2.20.1...v2.20.2) (2023-01-03)


### Bug Fixes

* **project-info:** more explicit origin repo url matching ([e2f08dc](https://github.com/omniboard-dev/analyzer/commit/e2f08dc1e4fa8968e1889b971d504abceef391d3))

### [2.20.1](https://github.com/omniboard-dev/analyzer/compare/v2.20.0...v2.20.1) (2023-01-02)

## [2.20.0](https://github.com/omniboard-dev/analyzer/compare/v2.19.1...v2.20.0) (2023-01-02)


### Features

* **project-info:** resolve repository url from .git/config for all project types ([fc5569f](https://github.com/omniboard-dev/analyzer/commit/fc5569f91980fbcb1a67bf73dd9382c79fe7d374))

### [2.19.1](https://github.com/omniboard-dev/analyzer/compare/v2.19.0...v2.19.1) (2022-09-29)


### Bug Fixes

* **save-project:** try to prevent OOM for large results ([fa149fc](https://github.com/omniboard-dev/analyzer/commit/fa149fca1590675f3f78c4a29633690af311cce5))

## [2.19.0](https://github.com/omniboard-dev/analyzer/compare/v2.18.2...v2.19.0) (2022-05-23)


### Features

* **cli:** better contrast for analyzer feedback icons ([5adee1c](https://github.com/omniboard-dev/analyzer/commit/5adee1cbb26d3826a24303219535b07212c3ca25))

### [2.18.2](https://github.com/omniboard-dev/analyzer/compare/v2.18.1...v2.18.2) (2022-05-04)


### Bug Fixes

* **json-check:** handle json path failures in more robust way ([04d08c4](https://github.com/omniboard-dev/analyzer/commit/04d08c48ab9db995bec9c8643afc7fa812243d19))

### [2.18.1](https://github.com/omniboard-dev/analyzer/compare/v2.18.0...v2.18.1) (2022-03-25)


### Bug Fixes

* **test-check:** print full result in the cli output ([3f74310](https://github.com/omniboard-dev/analyzer/commit/3f74310d5a65115d542c313ceb75f6c2883f1b4d))

## [2.18.0](https://github.com/omniboard-dev/analyzer/compare/v2.17.1...v2.18.0) (2022-02-01)


### Features

* **options:** add --api-url (--api) option for on-prem Omniboard instance for custom enterprise plans ([b6f45c7](https://github.com/omniboard-dev/analyzer/commit/b6f45c7cd16d319ee784149aad6993bcc77a65bb))

### [2.17.1](https://github.com/omniboard-dev/analyzer/compare/v2.17.0...v2.17.1) (2022-01-31)


### Bug Fixes

* 🐛 strip traling commas ([cdbf722](https://github.com/omniboard-dev/analyzer/commit/cdbf722ff26d9a40e5fc4efaa1bfe125c8679bef))

## [2.17.0](https://github.com/omniboard-dev/analyzer/compare/v2.16.1...v2.17.0) (2022-01-21)


### Features

* 🎸 add flag to silent the renderer ([789c5ce](https://github.com/omniboard-dev/analyzer/commit/789c5ceda2122eb5e77412b0d2c9838aee5a3c30))

### [2.16.1](https://github.com/omniboard-dev/analyzer/compare/v2.16.0...v2.16.1) (2022-01-20)


### Bug Fixes

* **checks:** prevent OOM, disable concurrent with more than 100 checks ([6fd67c6](https://github.com/omniboard-dev/analyzer/commit/6fd67c67901c95e90fbb78cb00e6aeb281b43381))
* **lib:** json check robustness ([ddd8fb0](https://github.com/omniboard-dev/analyzer/commit/ddd8fb049917fdf1f876f8d4fb0553bdbe2d6439))

## [2.16.0](https://github.com/omniboard-dev/analyzer/compare/v2.15.2...v2.16.0) (2022-01-13)


### Features

* **lib:** json check robustness (use strip-json-comment before json data parsing) ([b35d8a2](https://github.com/omniboard-dev/analyzer/commit/b35d8a2bc14ea057686911dd658b92620cf6e1c8))

### [2.15.2](https://github.com/omniboard-dev/analyzer/compare/v2.15.1...v2.15.2) (2022-01-13)


### Bug Fixes

* **lib:** use connection or developerConnection for maven project repo url instead of url ([784de6a](https://github.com/omniboard-dev/analyzer/commit/784de6ac35bbdd2d5590c3826c3c0aabb17976cd))

### [2.15.1](https://github.com/omniboard-dev/analyzer/compare/v2.15.0...v2.15.1) (2021-12-15)


### Bug Fixes

* **lib:** remove debug log statement ([dfbbf71](https://github.com/omniboard-dev/analyzer/commit/dfbbf7129845ab31ffe19efa0657d6b974c1f64e))

## [2.15.0](https://github.com/omniboard-dev/analyzer/compare/v2.14.0...v2.15.0) (2021-12-10)


### Features

* **project-info:** pip (python) project support ([442430b](https://github.com/omniboard-dev/analyzer/commit/442430bc44c26565026d060b3f19fdf85ed7c3c8))

## [2.14.0](https://github.com/omniboard-dev/analyzer/compare/v2.13.0...v2.14.0) (2021-12-09)


### Features

* **project-info:** generic "repo" project support ([a8d2763](https://github.com/omniboard-dev/analyzer/commit/a8d2763190863be2d810895b92908f87013e56e1))

## [2.13.0](https://github.com/omniboard-dev/analyzer/compare/v2.12.0...v2.13.0) (2021-11-15)


### Features

* **checks:** json check robustness ([84348f8](https://github.com/omniboard-dev/analyzer/commit/84348f8ed86f4b4a7b8bd7f599a5a4010b141da2))
* **process:** enable verbose logging when flag is set ([d823e78](https://github.com/omniboard-dev/analyzer/commit/d823e78bdb0006c0a089ac4b3b370eda2506bc23))

## [2.12.0](https://github.com/omniboard-dev/analyzer/compare/v2.11.0...v2.12.0) (2021-10-20)


### Features

* **api:** use dedicated settings endpoint ([259a055](https://github.com/omniboard-dev/analyzer/commit/259a0555064186979f715a0204049296daad4b6e))

## [2.11.0](https://github.com/omniboard-dev/analyzer/compare/v2.10.0...v2.11.0) (2021-10-19)


### Features

* **release:** linux binaries support ([d0364cf](https://github.com/omniboard-dev/analyzer/commit/d0364cf870c7a160d683fe69d920c245c0e44d5c))

## [2.10.0](https://github.com/omniboard-dev/analyzer/compare/v2.9.0...v2.10.0) (2021-10-19)


### Features

* **release:** linux binaries support ([d711204](https://github.com/omniboard-dev/analyzer/commit/d7112045ae6fea5de3eb591cbbd6dceee195c9ce))

## [2.9.0](https://github.com/omniboard-dev/analyzer/compare/v2.8.5...v2.9.0) (2021-10-19)


### Features

* **release:** linux binaries ([3467e0e](https://github.com/omniboard-dev/analyzer/commit/3467e0ea67a7021f17ba344c8a4ce4cbaea6ca49))

### [2.8.5](https://github.com/omniboard-dev/analyzer/compare/v2.8.4...v2.8.5) (2021-10-19)


### Bug Fixes

* **ci:** adjust release github action configuration ([d83880b](https://github.com/omniboard-dev/analyzer/commit/d83880bab72ff0c34af876819bfc785b88fdfe47))
* **ci:** adjust release github action configuration ([ede84a0](https://github.com/omniboard-dev/analyzer/commit/ede84a027a5bb1163569c748e36a6e23022b1d49))

### [2.8.4](https://github.com/omniboard-dev/analyzer/compare/v2.8.3...v2.8.4) (2021-10-19)

### [2.8.3](https://github.com/omniboard-dev/analyzer/compare/v2.8.2...v2.8.3) (2021-10-19)

### [2.8.2](https://github.com/omniboard-dev/analyzer/compare/v2.8.1...v2.8.2) (2021-10-18)


### Bug Fixes

* **checks:** json check path property include default root identifier $ ([f8cd4fb](https://github.com/omniboard-dev/analyzer/commit/f8cd4fb78d0bb5ebfd54f345bdb01aaf40b799a9))

### [2.8.1](https://github.com/omniboard-dev/analyzer/compare/v2.8.0...v2.8.1) (2021-10-18)


### Bug Fixes

* **checks:** json check path property name ([9e73a8f](https://github.com/omniboard-dev/analyzer/commit/9e73a8f722286e50bd598cc1ea54575baf3725a3))

## [2.8.0](https://github.com/omniboard-dev/analyzer/compare/v2.7.0...v2.8.0) (2021-10-18)


### Features

* 🎸 json check ([1ce9774](https://github.com/omniboard-dev/analyzer/commit/1ce9774b1b70e475c5bdced1b54dc48232f61587))


### Bug Fixes

* 🐛 change task title at the end ([f95f818](https://github.com/omniboard-dev/analyzer/commit/f95f8182ef496a5e901ff0bbbfc38ecbdb721186))
* 🐛 rename JSON to lowercase ([a4801e4](https://github.com/omniboard-dev/analyzer/commit/a4801e4960f77f823e47d379f08e69842f7b5c3a))
* 🐛 use json path plus ([df3235d](https://github.com/omniboard-dev/analyzer/commit/df3235d736bad868f922e10e3b4f29e9a936a0ed))

## [2.7.0](https://github.com/omniboard-dev/analyzer/compare/v2.6.1...v2.7.0) (2021-08-27)


### Features

* **checks:** xpath match path resolution improvements ([6b736c9](https://github.com/omniboard-dev/analyzer/commit/6b736c9841caf8077d0e40613ea20fb152238ac9))
* **workspace:** upgrade dependencies ([ddb6240](https://github.com/omniboard-dev/analyzer/commit/ddb6240261ba484b11a87c6d67349ccbe1719dce))

### [2.6.1](https://github.com/omniboard-dev/analyzer/compare/v2.6.0...v2.6.1) (2021-08-26)


### Bug Fixes

* **checks:** xpath check robustness ([3ef8654](https://github.com/omniboard-dev/analyzer/commit/3ef8654bfceb018f6d9f9a36411c9496a4b6a393))

## [2.6.0](https://github.com/omniboard-dev/analyzer/compare/v2.5.0...v2.6.0) (2021-08-26)


### Features

* **checks:** add files check type support ([f883c51](https://github.com/omniboard-dev/analyzer/commit/f883c51affd143a517fd1ffb1b7073b526d2000b))

## [2.5.0](https://github.com/omniboard-dev/analyzer/compare/v2.4.2...v2.5.0) (2021-06-22)


### Features

* **docs:** add getting started video and omniboard command options ([a7e2a9a](https://github.com/omniboard-dev/analyzer/commit/a7e2a9ae7e6d1df1fc003203950a95c65dce1396))

### [2.4.2](https://github.com/omniboard-dev/analyzer/compare/v2.4.1...v2.4.2) (2021-04-30)


### Bug Fixes

* **project-info:** project info robustness, try to recover from malformed package.json / pom.xml ([a0d674a](https://github.com/omniboard-dev/analyzer/commit/a0d674a72aeb61036818831b5b787c9ff67819bc))

### [2.4.1](https://github.com/omniboard-dev/analyzer/compare/v2.4.0...v2.4.1) (2021-03-29)


### Bug Fixes

* **test-check:** resolve project info for test-check command ([a58d489](https://github.com/omniboard-dev/analyzer/commit/a58d4895a3b0edf35356d2d37f69f5c2a67ed8ac))

## [2.4.0](https://github.com/omniboard-dev/analyzer/compare/v2.3.0...v2.4.0) (2021-03-29)


### Features

* **test-check:** add test-check command to run check definition provided as CLI argument ([64339c9](https://github.com/omniboard-dev/analyzer/commit/64339c94b9fbb10ac2a184b669424ee1fa47e18a))

## [2.3.0](https://github.com/omniboard-dev/analyzer/compare/v2.2.0...v2.3.0) (2021-03-26)


### Features

* **process:** skip execution for projects with blacklisted names ([9da9fe5](https://github.com/omniboard-dev/analyzer/commit/9da9fe5b9221f87a5ef041ae383de719c31e0886))

## [2.2.0](https://github.com/omniboard-dev/analyzer/compare/v2.1.1...v2.2.0) (2021-03-19)


### Features

* **xpath:** angular template preprocessing, verbose flag support for xmldom parser errors ([324a91b](https://github.com/omniboard-dev/analyzer/commit/324a91b1a45f6024efdc8677d97ac45829a7ed27))

### [2.1.1](https://github.com/omniboard-dev/analyzer/compare/v2.1.0...v2.1.1) (2021-03-19)


### Bug Fixes

* **xpath:** only store xpath resutls with actual value, hide xmldom parse warnings ([19f8367](https://github.com/omniboard-dev/analyzer/commit/19f836725b250997a16ea66448fab5f319b8abda))

## [2.1.0](https://github.com/omniboard-dev/analyzer/compare/v2.0.0...v2.1.0) (2021-03-17)


### Features

* **checks:** visual feedback for check run result ([348b56b](https://github.com/omniboard-dev/analyzer/commit/348b56b13a126b7ebc68f3683f43e337b5544da0))

## [2.0.0](https://github.com/omniboard-dev/analyzer/compare/v1.2.1...v2.0.0) (2021-03-05)


### ⚠ BREAKING CHANGES

* **lib:** bump engines node version to >=12

### Features

* **lib:** use xpath xmldom instead of xml2js, refactor checks const / files resolution, add xpath check stub ([8ba09e3](https://github.com/omniboard-dev/analyzer/commit/8ba09e33b8fc728e8ee0f2270274385eeea4f727))
* **lib:** xpath check implementation, check-pattern flag ([df6e9e7](https://github.com/omniboard-dev/analyzer/commit/df6e9e7061fac5ea5fd1e44bf2741a10ef6a603c))


### Bug Fixes

* **process:** force-exit process on finish (prevent waiting for check timeouts) ([bd182eb](https://github.com/omniboard-dev/analyzer/commit/bd182eb161fedbce64f7f2fc4f46dfa5f2d70df6))

### [1.2.1](https://github.com/omniboard-dev/analyzer/compare/v1.2.0...v1.2.1) (2021-03-03)


### Bug Fixes

* **workspace:** bump versions (npm security audit) ([384e4f2](https://github.com/omniboard-dev/analyzer/commit/384e4f2a1c08b5bc7000b2cfddb52e80a4aad779))

## [1.2.0](https://github.com/omniboard-dev/analyzer/compare/v1.1.1...v1.2.0) (2021-02-26)


### Features

* **flags:** add option to unset default pattern flags with EMPTY token ([704f4c5](https://github.com/omniboard-dev/analyzer/commit/704f4c58ad98d8a1bff2344d02f23133416fb55b))

### [1.1.1](https://github.com/omniboard-dev/analyzer/compare/v1.1.0...v1.1.1) (2021-02-25)


### Bug Fixes

* 🐛 exclude .teamcity directory ([201ffb9](https://github.com/omniboard-dev/analyzer/commit/201ffb9688dd16d80a743f6ec41697d71767c930))

## [1.1.0](https://github.com/omniboard-dev/analyzer/compare/v1.0.0...v1.1.0) (2021-01-22)


### Features

* **project-info:** project info pom.xml support ([8bc3e42](https://github.com/omniboard-dev/analyzer/commit/8bc3e4201e658866f2483e90b1715ae23a68e349))

## [1.0.0](https://github.com/omniboard-dev/analyzer/compare/v0.1.15...v1.0.0) (2020-12-29)


### ⚠ BREAKING CHANGES

* **process:** run check tasks concurrently (perf improvement)

### Features

* **process:** run check tasks concurrently ([17ee231](https://github.com/omniboard-dev/analyzer/commit/17ee231e257bc2df828f3196815e4504ff511a61))

### 0.1.15 (2020-08-04)


### Features

* **api:** optional api request debug ([0830c44](https://github.com/omniboard-dev/analyzer/commit/0830c44882b28b987082caa8ff15f2f0fd674205))
* **checks:** capture regexp groups ([2473679](https://github.com/omniboard-dev/analyzer/commit/2473679ab02bcc983a31f2e84383a700ad57c672))
* **checks:** content and size checks ([022feab](https://github.com/omniboard-dev/analyzer/commit/022feab21c56b07c380606c416a9704cb376e9d0))
* **checks:** improve progress logging ([d45323a](https://github.com/omniboard-dev/analyzer/commit/d45323adad1d9197892f8416504e641e1da7bf77))
* **checks:** skip disabled checks ([0d0d81c](https://github.com/omniboard-dev/analyzer/commit/0d0d81cc222a27645360ec5958c2ef313c17340b))
* **cli:** add short aliases for help and version ([cfd22ff](https://github.com/omniboard-dev/analyzer/commit/cfd22ff0340645a1ad09939cd9f9cc4cfdb12de1))
* **commands:** add test-connection command ([f6d7ab9](https://github.com/omniboard-dev/analyzer/commit/f6d7ab9eb81fdc79e37b6df63aebf96201661efb))
* **docs:** add readme ([d11baf2](https://github.com/omniboard-dev/analyzer/commit/d11baf217162de794490e3a89b22fa11d2a842e6))
* **lib:** improve architecture, add runner, use skip instead of error ([74ece38](https://github.com/omniboard-dev/analyzer/commit/74ece383878e33d5bb235254f26ee4dd01323d13))
* **process:** display subscription limit error message ([96966b5](https://github.com/omniboard-dev/analyzer/commit/96966b5fc7f4a12bc5b48c35bd8afe70b0410035))
* **proxy:** add support for proxy when ENV variables are present ([59acd04](https://github.com/omniboard-dev/analyzer/commit/59acd047631649d65c6db0c43aff698fd98a6a8e))
* **tasks:** add project info, prepare and save tasks ([f729154](https://github.com/omniboard-dev/analyzer/commit/f729154782de8eca99eb6f51023f6066c7d08194))
* **tasks:** add retrieve checks task ([2224cd9](https://github.com/omniboard-dev/analyzer/commit/2224cd986e6465fb886af226f37801938d8f9b67))
* **tasks:** add run checks task, improve typing (context) ([50efee1](https://github.com/omniboard-dev/analyzer/commit/50efee16266b24f4b91b81c1c7475fbfd5569cbe))
* **tasks:** retrieve and store project repository url ([fbd0007](https://github.com/omniboard-dev/analyzer/commit/fbd0007f7626dc4cc3b5f32d08401db5f2c487a7))
* **tasks:** skip check when project name does NOT match provided pattern ([6bfc8a2](https://github.com/omniboard-dev/analyzer/commit/6bfc8a2b75c3383539fa5272c0794d0d3d63b1b0))
* **workspace:** add engines field, update readme ([93134ba](https://github.com/omniboard-dev/analyzer/commit/93134bacfe622a58548f8df125ef316c4ddafb9e))
* **workspace:** initial workspace setup ([2f302bc](https://github.com/omniboard-dev/analyzer/commit/2f302bcc88049c8f4961a6072a5d15c072a48832))


### Bug Fixes

* **checks:** use older regexp api to support node 10 ([c18ddd2](https://github.com/omniboard-dev/analyzer/commit/c18ddd296ffe107202ad209ee195ad3d5367ec01))
* **docs:** typos ([fbfb0ab](https://github.com/omniboard-dev/analyzer/commit/fbfb0ab766a8f59b6c30a3e4c5084368239a745e))
* **env:** handle both lower and uppercase proxy env variables ([aae4cd6](https://github.com/omniboard-dev/analyzer/commit/aae4cd6f9b4830a33c445bf6c851d8cde84be895))
* **lib:** run checks resolve all matches ([7c35320](https://github.com/omniboard-dev/analyzer/commit/7c3532012d748c84c2a76688e3b9488386be3540))
* **services:** regexp defaults, api url ([aca7934](https://github.com/omniboard-dev/analyzer/commit/aca79340bc7613d29e77aac4e83ff9169978793a))

### [0.1.14](https://github.com/omniboard-dev/analyzer/compare/v0.1.13...v0.1.14) (2020-08-04)


### Features

* **api:** optional api request debug ([98583b9](https://github.com/omniboard-dev/analyzer/commit/98583b9896909b4ffdbb33294b24a8ae31ed2176))

### [0.1.13](https://github.com/omniboard-dev/analyzer/compare/v0.1.12...v0.1.13) (2020-07-08)


### Bug Fixes

* **env:** handle both lower and uppercase proxy env variables ([4ad3954](https://github.com/omniboard-dev/analyzer/commit/4ad3954bf1690c230a22005be32ae04f5800dd12))

### [0.1.12](https://github.com/omniboard-dev/analyzer/compare/v0.1.11...v0.1.12) (2020-07-04)


### Bug Fixes

* **checks:** use older regexp api to support node 10 ([6aacfc7](https://github.com/omniboard-dev/analyzer/commit/6aacfc70d255fc280d229d6c479f4c9ccd8056fd))

### [0.1.11](https://github.com/omniboard-dev/analyzer/compare/v0.1.10...v0.1.11) (2020-07-01)


### Features

* **workspace:** add engines field, update readme ([1d0ecfe](https://github.com/omniboard-dev/analyzer/commit/1d0ecfe4aa1dc7aff9f0fb54f64aa5b6bf0ea978))

### [0.1.10](https://github.com/omniboard-dev/analyzer/compare/v0.1.9...v0.1.10) (2020-06-25)


### Features

* **checks:** improve progress logging ([69fe5dd](https://github.com/omniboard-dev/analyzer/commit/69fe5dd25c2e9a662f6ce4a2ec82594943eaf76f))

### [0.1.9](https://github.com/omniboard-dev/analyzer/compare/v0.1.8...v0.1.9) (2020-05-15)


### Features

* **checks:** content and size checks ([e711bbe](https://github.com/omniboard-dev/analyzer/commit/e711bbe8c2a4dae4102b0a5812f8044ac080d294))

### [0.1.8](https://github.com/omniboard-dev/analyzer/compare/v0.1.7...v0.1.8) (2020-05-15)

### [0.1.7](https://github.com/omniboard-dev/analyzer/compare/v0.1.6...v0.1.7) (2020-05-10)


### Features

* **process:** display subscription limit error message ([307fb5d](https://github.com/omniboard-dev/analyzer/commit/307fb5d64b28627f34cee09b793e0b0a4786daae))

### [0.1.6](https://github.com/omniboard-dev/analyzer/compare/v0.1.5...v0.1.6) (2020-04-19)


### Features

* **tasks:** retrieve and store project repository url ([8bee0c9](https://github.com/omniboard-dev/analyzer/commit/8bee0c95119ec32bfece6c877cd1936c3a7ff444))

### [0.1.5](https://github.com/omniboard-dev/analyzer/compare/v0.1.4...v0.1.5) (2020-04-03)


### Features

* **tasks:** skip check when project name does NOT match provided pattern ([fffdfcb](https://github.com/omniboard-dev/analyzer/commit/fffdfcbd50f070a599b96f404d8ab159da24800c))

### [0.1.4](https://github.com/omniboard-dev/analyzer/compare/v0.1.3...v0.1.4) (2020-04-02)


### Features

* **cli:** add short aliases for help and version ([588bc8d](https://github.com/omniboard-dev/analyzer/commit/588bc8d365babb39f4aa4d7e8528df12d58bbcfd))


### Bug Fixes

* **docs:** typos ([32e2bd9](https://github.com/omniboard-dev/analyzer/commit/32e2bd9b3ac436628b687a18fa6f6414d955699a))

### [0.1.3](https://github.com/omniboard-dev/analyzer/compare/v0.1.2...v0.1.3) (2020-04-01)


### Features

* **proxy:** add support for proxy when ENV variables are present ([d57e71d](https://github.com/omniboard-dev/analyzer/commit/d57e71db1d384828acdf15655f9395ff7429ad1f))

### [0.1.2](https://github.com/omniboard-dev/analyzer/compare/v0.1.1...v0.1.2) (2020-03-22)


### Features

* **docs:** add readme ([629cd7a](https://github.com/omniboard-dev/analyzer/commit/629cd7a30d0fdd698c8fea066946611188dceaef))

### 0.1.1 (2020-03-22)


### Features

* **checks:** capture regexp groups ([11e9a4e](https://github.com/omniboard-dev/analyzer/commit/11e9a4e5d015ae5ffad5ad4adcdb705e311bbb23))
* **checks:** skip disabled checks ([a3e053d](https://github.com/omniboard-dev/analyzer/commit/a3e053d0c2d9f823736b2db12f4292112daeeaf3))
* **commands:** add test-connection command ([f6d7ab9](https://github.com/omniboard-dev/analyzer/commit/f6d7ab9eb81fdc79e37b6df63aebf96201661efb))
* **lib:** improve architecture, add runner, use skip instead of error ([e7c4cad](https://github.com/omniboard-dev/analyzer/commit/e7c4cad32895f03b672afa7efdfed29eef97829b))
* **tasks:** add project info, prepare and save tasks ([f729154](https://github.com/omniboard-dev/analyzer/commit/f729154782de8eca99eb6f51023f6066c7d08194))
* **tasks:** add retrieve checks task ([650a967](https://github.com/omniboard-dev/analyzer/commit/650a9674ea8f7a2b6bff3649fbc8c8b8ec363c9e))
* **tasks:** add run checks task, improve typing (context) ([d8100ce](https://github.com/omniboard-dev/analyzer/commit/d8100ce218f489427ff9325cd6c304a4af584c92))
* **workspace:** initial workspace setup ([2f302bc](https://github.com/omniboard-dev/analyzer/commit/2f302bcc88049c8f4961a6072a5d15c072a48832))


### Bug Fixes

* **lib:** run checks resolve all matches ([561c73f](https://github.com/omniboard-dev/analyzer/commit/561c73fdb57e19ad763b3bf4642cd347d2ffffe5))
* **services:** regexp defaults, api url ([78c2d41](https://github.com/omniboard-dev/analyzer/commit/78c2d41ef87cca9e77d2f5fba13ee966f738a647))
