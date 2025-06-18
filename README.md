# mapapps-resultcenter

The mapapps resultcenter and selection-resultcenter provide functionality to .

![Screenshot App](https://github.com/conterra/mapapps-resultcenter/blob/main/screenshot.png)

## Build Status
[![devnet-bundle-snapshot](https://github.com/conterra/mapapps-resultcenter/actions/workflows/devnet-bundle-snapshot.yml/badge.svg)](https://github.com/conterra/mapapps-resultcenter/actions/workflows/devnet-bundle-snapshot.yml)

## Sample App
[T.B.D]

## Installation Guide
**Requirements:**
- map.apps 4.20.0 or later

Simply add the bundles "dn_resultcenter" and optional the bundle dn_selection-resultcenter to your app.

[dn_resultcenter Documentation](https://github.com/conterra/mapapps-resultcenter/tree/master/src/main/js/bundles/dn_resultcenter)

[dn_resultcenter Documentation](https://github.com/conterra/mapapps-resultcenter/tree/master/src/main/js/bundles/dn_selection-resultcenter)

## Quick start

Clone this project and ensure that you have all required dependencies installed correctly (see [Documentation](https://docs.conterra.de/en/mapapps/latest/developersguide/getting-started/set-up-development-environment.html)).

Then run the following commands from the project root directory to start a local development server:

```bash
# install all required node modules
$ mvn initialize

# start dev server
$ mvn compile -Denv=dev -Pinclude-mapapps-deps

# run unit tests
$ mvn test -P run-js-tests,include-mapapps-deps
```
