# Changelog

## [1.6.5](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.6.4...v1.6.5) (2024-12-26)

### Code Refactoring

* adjust standard deviation filter to 2 sigma in dataClean function ([2eb8689](https://github.com/PetroVoronov/svitlobot-monitor/commit/2eb8689c25d261e3538e335b54ed87475e190466))

## [1.6.4](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.6.3...v1.6.4) (2024-12-26)

### Code Refactoring

* remove city prefix from groupId in index.js to align with new format by svitlobot ([5f1d4de](https://github.com/PetroVoronov/svitlobot-monitor/commit/5f1d4de022c42a688f0ea88d8ab6a4543c03669c))

### Miscellaneous Chores

* **deps-dev:** Bump globals from 15.13.0 to 15.14.0 ([558fc2e](https://github.com/PetroVoronov/svitlobot-monitor/commit/558fc2e1b780e93bf0f30443c9035beb919e41b2))
* **deps-dev:** Bump markdownlint-cli2 from 0.15.0 to 0.16.0 ([6837e96](https://github.com/PetroVoronov/svitlobot-monitor/commit/6837e9696c6f24f329d43651b5df07135c7d9fb0))

## [1.6.3](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.6.2...v1.6.3) (2024-12-09)

### Bug Fixes

* **localization:** update Ukrainian translation for time units ([1654c15](https://github.com/PetroVoronov/svitlobot-monitor/commit/1654c1535365a24cc91bd848f51d05f2095337a1))

### Miscellaneous Chores

* **deps-dev:** Bump eslint-plugin-sonarjs from 2.0.4 to 3.0.1 ([d6127dd](https://github.com/PetroVoronov/svitlobot-monitor/commit/d6127dd217590cc1379a7c00a5d4ff4fe6195301))
* **deps-dev:** Bump globals from 15.12.0 to 15.13.0 ([6509d0b](https://github.com/PetroVoronov/svitlobot-monitor/commit/6509d0b117c364f2431f1a75082021518e6f7c75))
* **deps:** Bump axios from 1.7.7 to 1.7.9 ([21482ec](https://github.com/PetroVoronov/svitlobot-monitor/commit/21482ecb39d1f69823aadd62113bdb5e70a1aa16))
* **deps:** Bump grammy from 1.32.0 to 1.33.0 ([c6a9ae7](https://github.com/PetroVoronov/svitlobot-monitor/commit/c6a9ae70f35cf41cbd3f60ca850b20ac2145fedc))

## [1.6.2](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.6.1...v1.6.2) (2024-11-25)

### Code Refactoring

* update localization strings and enhance command-line options ([be75dd3](https://github.com/PetroVoronov/svitlobot-monitor/commit/be75dd33df0460d4af635eaa0267b7eddf9da549))

### Documentation

* updated documentation to cover new command line options for the "new" algorithm ([be75dd3](https://github.com/PetroVoronov/svitlobot-monitor/commit/be75dd33df0460d4af635eaa0267b7eddf9da549))

## [1.6.1](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.6.0...v1.6.1) (2024-11-22)

### Code Refactoring

* update uk locale ([a99e5ab](https://github.com/PetroVoronov/svitlobot-monitor/commit/a99e5ab0b78dc9c82b90acd9a13f7ebcecfce5e0))

## [1.6.0](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.6...v1.6.0) (2024-11-22)

### Features

* added new method of tendency detection with appropriate command line options. ([31a138e](https://github.com/PetroVoronov/svitlobot-monitor/commit/31a138e1e29cd06280f366aa1d18125151a25edb))

### Bug Fixes

* correct tendency change detection logic and adjust stats buffer management ([8613b43](https://github.com/PetroVoronov/svitlobot-monitor/commit/8613b4352186e1a7784cb72f80fafcd1f8d86c42))

### Code Refactoring

* add to message current percentage and latest delta ([31a138e](https://github.com/PetroVoronov/svitlobot-monitor/commit/31a138e1e29cd06280f366aa1d18125151a25edb))
* improve detection if no stable tendency in place ([83db128](https://github.com/PetroVoronov/svitlobot-monitor/commit/83db12871363d89e248598eb3fb6cbbf0636f780))
* improve tendency detection messages with interval information and improve logic for stability checks ([8ff5031](https://github.com/PetroVoronov/svitlobot-monitor/commit/8ff50319d8b9740c39bc63330ed8c98869ebd388))
* rename tendency detection variables for clarity and consistency ([83db128](https://github.com/PetroVoronov/svitlobot-monitor/commit/83db12871363d89e248598eb3fb6cbbf0636f780))
* reorder command line options and make cleanup the "old" data if tendency detected ([36163d1](https://github.com/PetroVoronov/svitlobot-monitor/commit/36163d1da653d0b26b86a81c14e3f16bc0f1666b))
* tendency detection ([23a64fd](https://github.com/PetroVoronov/svitlobot-monitor/commit/23a64fdc21dad2880e63ad69bcff818751e25ef1))

### Miscellaneous Chores

* **deps-dev:** Bump globals from 15.11.0 to 15.12.0 ([9be0430](https://github.com/PetroVoronov/svitlobot-monitor/commit/9be04302cdfbea1ba95830259e0f0e4ead27d5ab))
* **deps-dev:** Bump markdownlint-cli2 from 0.14.0 to 0.15.0 ([a00df5c](https://github.com/PetroVoronov/svitlobot-monitor/commit/a00df5c78feb4ad144dc795467c7b3f209718c30))
* **deps:** Bump grammy from 1.31.0 to 1.32.0 ([4879d7c](https://github.com/PetroVoronov/svitlobot-monitor/commit/4879d7c3042a5978789f0b708f37e110e2713237))
* **deps:** Bump telegram from 2.26.6 to 2.26.8 ([477250c](https://github.com/PetroVoronov/svitlobot-monitor/commit/477250cb62ce06168ffc5b4a7cf9eb20b094bf4a))
* reorder command line options ([23a64fd](https://github.com/PetroVoronov/svitlobot-monitor/commit/23a64fdc21dad2880e63ad69bcff818751e25ef1))

## [1.5.6](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.5...v1.5.6) (2024-11-06)

### Code Refactoring

* **cache:** refactor code of Cache class with type conversion and event reactions ([adb9825](https://github.com/PetroVoronov/svitlobot-monitor/commit/adb98256bb4ff46729599549f725cf081fe098b0))
* **logging:** refactor code of SecuredLogger with sensitive data masking ([adb9825](https://github.com/PetroVoronov/svitlobot-monitor/commit/adb98256bb4ff46729599549f725cf081fe098b0))

### Miscellaneous Chores

* **deps-dev:** Bump @babel/core from 7.25.8 to 7.26.0 ([1f607b6](https://github.com/PetroVoronov/svitlobot-monitor/commit/1f607b60cc19e06f8f0e46ce8101b373d2183156))
* **deps-dev:** Bump @babel/eslint-parser from 7.25.8 to 7.25.9 ([cf2de8b](https://github.com/PetroVoronov/svitlobot-monitor/commit/cf2de8bbd037b8d3dc665caaeb8f39510c5acb97))
* **deps-dev:** Bump eslint-plugin-sonarjs from 2.0.3 to 2.0.4 ([3e7c6fb](https://github.com/PetroVoronov/svitlobot-monitor/commit/3e7c6fb77afff93e678d65c971f3cea8bb20a864))
* **deps:** Bump grammy from 1.30.0 to 1.31.0 ([ba5df70](https://github.com/PetroVoronov/svitlobot-monitor/commit/ba5df70ad52f9b40dc760f8171d96ffa59f841d6))
* **deps:** Bump node from 22-alpine to 23-alpine ([2482e8a](https://github.com/PetroVoronov/svitlobot-monitor/commit/2482e8ab9c35b559800f069b506985194699adb1))
* **deps:** Bump telegram from 2.25.15 to 2.26.6 ([a4a726f](https://github.com/PetroVoronov/svitlobot-monitor/commit/a4a726fb7b0fa3e06481357b751d96f8bfd0eb6e))
* **dev:** add Jest configuration and dependency ([adb9825](https://github.com/PetroVoronov/svitlobot-monitor/commit/adb98256bb4ff46729599549f725cf081fe098b0))

### Tests

* **cache:** add some tests ([adb9825](https://github.com/PetroVoronov/svitlobot-monitor/commit/adb98256bb4ff46729599549f725cf081fe098b0))
* **logging:** add some tests ([adb9825](https://github.com/PetroVoronov/svitlobot-monitor/commit/adb98256bb4ff46729599549f725cf081fe098b0))

## [1.5.5](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.4...v1.5.5) (2024-10-16)

### Miscellaneous Chores

* **deps-dev:** Bump @babel/core from 7.25.7 to 7.25.8 ([f476465](https://github.com/PetroVoronov/svitlobot-monitor/commit/f4764653b744cfda288954ebd08ca2be394bb607))
* **deps-dev:** Bump @babel/eslint-parser from 7.25.7 to 7.25.8 ([4e18db4](https://github.com/PetroVoronov/svitlobot-monitor/commit/4e18db48da4bcbba714951a376345ec74424c6bd))
* **deps-dev:** Bump globals from 15.10.0 to 15.11.0 ([291eacf](https://github.com/PetroVoronov/svitlobot-monitor/commit/291eacf3ddbd3d602589156c802fd5b860979c57))
* **deps:** Bump telegram from 2.25.11 to 2.25.15 ([476933d](https://github.com/PetroVoronov/svitlobot-monitor/commit/476933d04d57974f356126906c2c243a3c0509ab))

## [1.5.4](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.3...v1.5.4) (2024-10-07)

### Continuous Integration

* **release-please:** run CHANGELOG.md through markdownlint-cli2 on PR's ([0e670b3](https://github.com/PetroVoronov/svitlobot-monitor/commit/0e670b3beeaf22b547ba74c1388beade6c0d03be))

### Miscellaneous Chores

* **deps-dev:** Bump @babel/core from 7.25.2 to 7.25.7 ([4718158](https://github.com/PetroVoronov/svitlobot-monitor/commit/4718158544ccaeba957dbaa4a4fbc4dd587cf269))
* **deps-dev:** Bump @babel/eslint-parser from 7.25.1 to 7.25.7 ([dd437b8](https://github.com/PetroVoronov/svitlobot-monitor/commit/dd437b86e0b2890c624562d7399caf42f421d7de))
* **deps-dev:** Bump eslint-plugin-sonarjs from 2.0.2 to 2.0.3 ([4b6b5c1](https://github.com/PetroVoronov/svitlobot-monitor/commit/4b6b5c1580a89380a20b838c9bb6a9ee6d98e351))
* **deps-dev:** Bump globals from 15.9.0 to 15.10.0 ([122c239](https://github.com/PetroVoronov/svitlobot-monitor/commit/122c23910a4ebf52f62532083af42e34431237d9))
* **dev:** Add markdownlint-cli2 to improve format of documentation (README's, CHANGELOG) ([0e670b3](https://github.com/PetroVoronov/svitlobot-monitor/commit/0e670b3beeaf22b547ba74c1388beade6c0d03be))

### Documentation

* Fix README's and CHANGELOG formatting through markdownlint-cli2 ([0e670b3](https://github.com/PetroVoronov/svitlobot-monitor/commit/0e670b3beeaf22b547ba74c1388beade6c0d03be))
* Fix README's sections related to the default start mode and first Docker runs ([0e670b3](https://github.com/PetroVoronov/svitlobot-monitor/commit/0e670b3beeaf22b547ba74c1388beade6c0d03be))

## [1.5.3](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.2...v1.5.3) (2024-10-04)

### Code Refactoring

* **docker:** update Dockerfile entrypoint and clear CMD. **Please be aware* - it has influence, if you use modified command-line ([9a739cf](https://github.com/PetroVoronov/svitlobot-monitor/commit/9a739cfa0718d905f4b9015c3edd10526eac945b))

### Continuous Integration

* modify release-please config for changelog sections to reorder them ([9a739cf](https://github.com/PetroVoronov/svitlobot-monitor/commit/9a739cfa0718d905f4b9015c3edd10526eac945b))

### Documentation

* Update README's to reflect the changes in Dockerfile ([9a739cf](https://github.com/PetroVoronov/svitlobot-monitor/commit/9a739cfa0718d905f4b9015c3edd10526eac945b))

## [1.5.2](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.1...v1.5.2) (2024-09-27)

### Continuous Integration

* Update repo description in deploy_docker_on_tag.yml ([6287282](https://github.com/PetroVoronov/svitlobot-monitor/commit/62872822e4cf036c97e8dc93207a3d4b768c3875))

### Miscellaneous Chores

* **deps:** Bump telegram from 2.25.4 to 2.25.11 ([5506c54](https://github.com/PetroVoronov/svitlobot-monitor/commit/5506c549230706c720b0e25f835f6920d8bc333f))

## [1.5.1](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.5.0...v1.5.1) (2024-09-20)

### Documentation

* Fix mistypings in 'SvitloBot` ... ([43af232](https://github.com/PetroVoronov/svitlobot-monitor/commit/43af2325f29be9aae9ebf99554bb9ed303612e49))
* Refactor CHANGELOG.md to categorize miscellaneous chores ([c752cc8](https://github.com/PetroVoronov/svitlobot-monitor/commit/c752cc88f61adbd96ca063e0264ba6b833bab911))

### Bug Fixes

* mistyping, when `timeForDateBack` used before initialization ([43af232](https://github.com/PetroVoronov/svitlobot-monitor/commit/43af2325f29be9aae9ebf99554bb9ed303612e49))

### Code Refactoring

* handle errors in checkGroupTendency() for `axios` request to `SviltoBot API`. ([43af232](https://github.com/PetroVoronov/svitlobot-monitor/commit/43af2325f29be9aae9ebf99554bb9ed303612e49))
* Refactor logging statements in Cache.js ([0a1cb16](https://github.com/PetroVoronov/svitlobot-monitor/commit/0a1cb16043fe0af725dc710bfee40634262560ee))

## [1.5.0](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.4.0...v1.5.0) (2024-09-16)

### Miscellaneous Chores

* `no-telegram` options renamed to `without-telegram` and has no short key now ([1454116](https://github.com/PetroVoronov/svitlobot-monitor/commit/1454116c1b06a13aaceba8b5a9dfa1b67681d5f7))
* Additional logging of command-line options on start ([1454116](https://github.com/PetroVoronov/svitlobot-monitor/commit/1454116c1b06a13aaceba8b5a9dfa1b67681d5f7))

### Documentation

* Append missed records to CHANGELOG.md ([3e0f31b](https://github.com/PetroVoronov/svitlobot-monitor/commit/3e0f31b4535857d905cfafdf10e27e83543e8a9b))

### Features

* New option: `nightTime` - Interval in hours, when the script is sending messages in silent mode. Format is "start:stop" in 24h format ([1454116](https://github.com/PetroVoronov/svitlobot-monitor/commit/1454116c1b06a13aaceba8b5a9dfa1b67681d5f7))

## [1.4.0](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.8...v1.4.0) (2024-09-15)

### Continuous Integration

* Fix README file to include GitHub release badges ([a8eaf62](https://github.com/PetroVoronov/svitlobot-monitor/commit/a8eaf62012ab6d2c459160063c5d40e350f5b2f2))
* Refactor updating the script version in code ([c298744](https://github.com/PetroVoronov/svitlobot-monitor/commit/c2987444ad07579b8dbb32cd19f2308e4281cdb8))

### Features

* Replace `telegraf` with `grammy` ([3f11199](https://github.com/PetroVoronov/svitlobot-monitor/commit/3f111997aa126624449cc09c5a1a6e6ec8bf8f6f))

### Bug Fixes

* Added overrides for `whatwg-url` to version 14.0.0, to get rid of "DeprecationWarning: The `punycode` module is deprecated." ([3f11199](https://github.com/PetroVoronov/svitlobot-monitor/commit/3f111997aa126624449cc09c5a1a6e6ec8bf8f6f))
* Fixed reading and writing the `null` or `undefined` values in `Cache` module ([0fad862](https://github.com/PetroVoronov/svitlobot-monitor/commit/0fad8629dbb0cbc20477923155890b9864c29ce5))

### Code Refactoring

* **telegram:** Code to interact with `Telegram` is rewritten, to make it more unified, independently from mode (user or bot) ([3f11199](https://github.com/PetroVoronov/svitlobot-monitor/commit/3f111997aa126624449cc09c5a1a6e6ec8bf8f6f))

## [1.3.8](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.7...v1.3.8) (2024-09-14)

### Continuous Integration

* Add release-please workflow configuration ([1472725](https://github.com/PetroVoronov/svitlobot-monitor/commit/1472725a0c126ca6ad3afa1da94cdf6986967031))

### Documentation

* Refactor README files to include GitHub release badges ([152b850](https://github.com/PetroVoronov/svitlobot-monitor/commit/152b850cb87d74d23316d54114ad92c84104866f))

## [1.3.7](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.6...v1.3.7) (2024-09-14)

### Miscellaneous Chores

* Update dependencies in package-lock.json and package.json ([accba1f](https://github.com/PetroVoronov/svitlobot-monitor/commit/accba1fbe62e8d661ceb6c0388271c14ba2a49bc))
* Refactor logging to reuse the logger from the `gramjs` and adding the functionality to mask sensitive data in logs ([821351e](https://github.com/PetroVoronov/svitlobot-monitor/commit/821351ed981336141542d7ce44baa67a08789a42))
* Refactor user session file migration log messages([9fa33d2](https://github.com/PetroVoronov/svitlobot-monitor/commit/9fa33d2a0da2f64fa7d446c6a22497349f7bbfed)))

## [1.3.6](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.5...v1.3.6) (2024-09-14)

### Continuous Integration

* Update npm install command to use 'npm ci' in Dockerfile and make it dependant on `TARGETPLATFORM`. ([9b1f455](https://github.com/PetroVoronov/svitlobot-monitor/commit/9b1f455038386280bc970561685682e855616980))

### Code Refactoring

* Refactor user session file migration logic([4dcb970](https://github.com/PetroVoronov/svitlobot-monitor/commit/4dcb970962be392a6af5d3a98b0f210883814e1a))

## [1.3.5](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.4...v1.3.5) (2024-09-13)

### Bug Fixes

* Bump version to 1.3.5 and fix type check for Telegram bot auth token to get it from environment variable ([9ff534b](https://github.com/PetroVoronov/svitlobot-monitor/commit/9ff534b4ef9608bfce64ef34f8afb3a61a4559c2))

### Features

* Add startup log message with script version and group ID ([d76de7e](https://github.com/PetroVoronov/svitlobot-monitor/commit/d76de7e80decf5eb968f360c682a9054595bcd63))

## [1.3.4](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.3...v1.3.4) (2024-09-13)

### Bug Fixes

* Bump version to 1.3.4 and set missing default values for command-line boolean options ([60c874c](https://github.com/PetroVoronov/svitlobot-monitor/commit/60c874c804fb4bb5dadedb79c8bec4d6b4fa78cb))

### Documentation

* Update README files to clarify Docker first run instructions for Telegram user and bot modes ([44231b3](https://github.com/PetroVoronov/svitlobot-monitor/commit/44231b342769396292384b0c77726a57c83ad254))

## [1.3.3](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.2...v1.3.3) (2024-09-13)

### Bug Fixes

* Bump version to 1.3.3 and fix condition in getMessageTargetIds function (mistyping) ([72cd04a](https://github.com/PetroVoronov/svitlobot-monitor/commit/72cd04a3313b473170aa2a87f63ea4a142aa46e9))

### Documentation

* Refactor README files to improve formatting of command-line options ([22f48ed](https://github.com/PetroVoronov/svitlobot-monitor/commit/22f48edf899cdfc8007a13226ae312599ce78d5d))

## [1.3.2](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.1...v1.3.2) (2024-09-13)

### Documentation

* Refactor README files to improve formatting of command-line options ([22f48ed](https://github.com/PetroVoronov/svitlobot-monitor/commit/22f48edf899cdfc8007a13226ae312599ce78d5d))

## [1.3.1](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.3.0...v1.3.1) (2024-09-13)

### Bug Fixes

* Remove unnecessary (debug) function `telegramMessageOnChange` call in src/index.js ([dc9fda2](https://github.com/PetroVoronov/svitlobot-monitor/commit/dc9fda27d3d4217af6b7730412274a9d918f71ee))

## [1.3.0](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.2.0...v1.3.0) (2024-09-13)

### Features

* Refactor the script to work in Bot mode by default ([37306f4](https://github.com/PetroVoronov/svitlobot-monitor/commit/37306f4d6333b3a0e15cdbae047a4ca14e237945))

## [1.2.0](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.1.5...v1.2.0) (2024-09-12)

### Features

* Refactor the script to work in `'as-bot` mode via `telegraf` package instead of `gramjs` ([2ca5392](https://github.com/PetroVoronov/svitlobot-monitor/commit/2ca5392f4e77cd0d6aa896cdf3a2b400e734492b))

### Documentation

* Refactor README files to update the format for specifying multiple step-interval pairs ([c07a698](https://github.com/PetroVoronov/svitlobot-monitor/commit/c07a6989aafdfb2388a0210a8caf05b90b3d4b8a))

## [1.1.5](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.1.4...v1.1.5) (2024-09-10)

### Bug Fixes

* Refactor change stats handling and comparing, i.e. time interval, delta etc ([c84a5f1](https://github.com/PetroVoronov/svitlobot-monitor/commit/c84a5f1a5906935baf45a1c7b720ec92050711cc))

## [1.1.4](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.1.3...v1.1.4) (2024-09-10)

### Documentation

* Refactor Ukrainian and English README files for clarity and consistency ([75b7617](https://github.com/PetroVoronov/svitlobot-monitor/commit/75b7617216f0188b9a90f9d1822d195ed6606598))
* Refactor Ukrainian README file to improve language clarity and consistency ([9f8e77e](https://github.com/PetroVoronov/svitlobot-monitor/commit/9f8e77ecadd5ed3c6ddc4c1cf9c4a0f0d54ca7e3))

## [1.1.3](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.1.2...v1.1.3) (2024-09-09)

### Code Refactoring

* Refactor getTelegramTargetEntity function to use more descriptive variable names and improve error handling ([0482792](https://github.com/PetroVoronov/svitlobot-monitor/commit/0482792adba54bd607af4121b48ebfe154e15717))

## [1.1.2](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.1.0...v1.1.2) (2024-09-09)

### Bug Fixes

* Update packages ([4566d85](https://github.com/PetroVoronov/svitlobot-monitor/commit/4566d85231674a8e3d09072022a6223f1102282b))

### Documentation

* Refactor README files to include Docker image version and license badges in both English and Ukrainian versions ([c8e413d](https://github.com/PetroVoronov/svitlobot-monitor/commit/c8e413d06fd7a246a7c11a11531ba133d1f4baa1))
* Refactor Dockerfile and README files ([4866ca3](https://github.com/PetroVoronov/svitlobot-monitor/commit/4866ca36087d080529a321db75c3cdcb409b5dd1))

### Miscellaneous Chores

* Merge pull request #2 from PetroVoronov/dependabot/npm_and_yarn/telegram-2.24.11 ([1c79ac7](https://github.com/PetroVoronov/svitlobot-monitor/commit/1c79ac72a8e3718f9e27e19a2ef27850499b0319))
* Merge pull request #1 from PetroVoronov/dependabot/npm_and_yarn/eslint-plugin-sonarjs-2.0.2 ([7896dea](https://github.com/PetroVoronov/svitlobot-monitor/commit/7896dead32165dffa636dfacef9c9c766703e705))
* Bump telegram from 2.22.2 to 2.24.11 ([f0d8deb](https://github.com/PetroVoronov/svitlobot-monitor/commit/f0d8deb0b4cdf7842c16bc979792d72937e63352))
* Bump eslint-plugin-sonarjs from 1.0.4 to 2.0.2 ([174fd1e](https://github.com/PetroVoronov/svitlobot-monitor/commit/174fd1ecd1c913613c0b3cf6d3f5a13ef9771924))
* Make a preparation to public release, i.e. add README.md and README-uk.md, locales, update Dockerfile and docker image generation `Actions` ([5bda76b](https://github.com/PetroVoronov/svitlobot-monitor/commit/5bda76b8ddb5a5ee037069a8f652fdb0da071d0c))

## [1.1.0](https://github.com/PetroVoronov/svitlobot-monitor/compare/v1.0.8...v1.1.0) (2024-08-29)

### Code Refactoring

* Work with several pairs of percentage delta and time delta. Improved Dockerfile. Improved package.json ([74744c3](https://github.com/PetroVoronov/svitlobot-monitor/commit/74744c3a72a4219c068fc060eb7e98672e903762))

## 1.0.8 (2024-07-31)

### Code Refactoring

* Improve group statistics handling ([67576c7](https://github.com/PetroVoronov/svitlobot-monitor/commit/67576c7d9d1307649674ecfe5dea8a9dd3ff4e52))

### Miscellaneous Chores

* Update telegram npm dependency to version 2.22.2 ([4e2e39e](https://github.com/PetroVoronov/svitlobot-monitor/commit/4e2e39ebe763e235c73142195fc16e6754dab9d0))

## 1.0.6 (2024-07-28)

### Features

* Add option to read wrong groups from file and then exclude from stats

## 1.0.4 (2024-07-28)

### Features

* Update Dockerfile and localization files ([4c558fc](https://github.com/PetroVoronov/svitlobot-monitor/commit/4c558fc06a74cbd959514c9fa82148b63e67857e))

### Code Refactoring

* Update `telegramChatId` and `telegramTopicId` variable names ([2e4c06a](https://github.com/PetroVoronov/svitlobot-monitor/commit/2e4c06a18b88bec9ca348b0c42097bf7f8dcf25e))
* Update `vscode` settings ([f948502](https://github.com/PetroVoronov/svitlobot-monitor/commit/f9485023f70f7f409183991019af50b84640ff9e))
* Fix message in telegramMessageOnChange function (was "off" instead of "on") ([34969a9](https://github.com/PetroVoronov/svitlobot-monitor/commit/34969a9622acb6c74a4c9b075786dc56bfba9efa))
* Update timeInterval calculation and comparison to fix bug ([538165d](https://github.com/PetroVoronov/svitlobot-monitor/commit/538165d207a3e75bbdfdf9efbe91e46652cf5009))

## 1.0.2 (2024-07-27)

### Features

* Implemented the data grabbing and analyze. Command line handling is improved. Added localization files for German, English, Russian, and Ukrainian.
  * Added several command line options:
    * `g` or `group` - DTEK group id;
    * `i` or `time-interval` - Time interval in minutes, to detect the tendency;
    * `s` or `value-step` - Value step in percentage, to detect the tendency;
    * `r` or `refresh-interval` - Refresh interval in minutes, to get the data.
  * Data processing:
    * Filters the data lines by city and group, and split result to `on` and `off` states.
    * Then data is cleaned to use only normal distribution from average.
    * Then stats are stored in buffer, with timestamp.
    * Then compared with stats time-interval back from now.
    * If percentage is changed more than on given value - the tendency is identified.
    * If tendency is changed - appropriate message is generated.

### Miscellaneous Chores

* Refactor Telegram client initialization and error handling ([7d7349a](https://github.com/PetroVoronov/svitlobot-monitor/commit/7d7349abe7794ef1d23ac76bdab1f0cf56a70bad))

## 1.0.0 (2024-07-27)

### Miscellaneous Chores

* Initial "template" version 1.0.0 ([d643fdc](https://github.com/PetroVoronov/svitlobot-monitor/commit/d643fdc939a46068cf2a6a13a031b2efd7955c63))
* Initial commit ([b0d4bcd](https://github.com/PetroVoronov/svitlobot-monitor/commit/b0d4bcd66cd6622a51f5bb17c72f1fa715182781))
