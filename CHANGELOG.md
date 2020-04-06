# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2020-04-06
### Changed
- Dependencies updated to use API Session new features

## [2.1.2] - 2020-01-21
### Changed
- Updated `defaultSessionData` with stores fields

## [2.1.1] - 2020-01-21
### Changed
- Dependencies updated

## [2.1.0] - 2019-10-21
### Added
- Session client getter injection using `client` rule property

## [2.0.0] - 2019-10-02
### Changed
- Now it works to test API v4

### Added
- Rule parameter `session`

### Removed
- Rule parameter `client` (**BREAKING CHANGE**)

## [1.4.1] - 2019-08-20
### Fixed
- Replaced `deepEqual` deprecated method with `deepStrictEqual` when validating test results

## [1.4.0] - 2019-08-07
### Added
- Active client can be set as an object or a boolean (injects a default client)

## [1.3.0] - 2019-08-01
### Added
- Optional `getResponse` function for getting the response before the assertions

## [1.2.0] - 2019-07-31
### Added
- Client propagation added

### Changed
- Endpoint per rule now should be send in request object

## [1.1.0] - 2019-07-31
### Added
- Rules can receive endpoint or for all rules

## [1.0.0] - 2019-07-23
### Added
- `APITest` module for testing
- `APITestError` for validation rule error
