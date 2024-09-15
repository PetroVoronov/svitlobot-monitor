# Changelog

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
