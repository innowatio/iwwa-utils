[![npm version](https://badge.fury.io/js/iwwa-utils.svg)](https://badge.fury.io/js/iwwa-utils)
[![Build Status](https://travis-ci.org/innowatio/iwwa-utils.svg?branch=master)](https://travis-ci.org/innowatio/iwwa-utils)
[![codecov.io](https://codecov.io/github/innowatio/iwwa-utils/coverage.svg?branch=master)](https://codecov.io/github/innowatio/iwwa-utils?branch=master)
[![Dependency Status](https://david-dm.org/innowatio/iwwa-utils.svg)](https://david-dm.org/innowatio/iwwa-utils)
[![devDependency Status](https://david-dm.org/innowatio/iwwa-utils/dev-status.svg)](https://david-dm.org/innowatio/iwwa-utils#info=devDependencies)

# iwwa-utils

Library of common utility used in iwwa-front and iwapp

## Install

`npm install --save iwwa-utils`

## API

### Consumption utils

#### getTimeRangeByPeriod(period)

###### Arguments

* `period` **string** _required_: period to consider `[e.g. "day", "week", "month", "year"]`

###### Example usage

Now is "2016-10-14"

```js
getTimeRangeByPeriod("month")

--> {
    start: "2016-10-01T00:00:00.000Z",
    end: "2016-10-31T23:59:59.999Z"
}
```

#### getPreviousPeriod(periodToSubtract, periodRange)

###### Arguments

* `periodToSubtract` **string** _required_: period to subtract `[e.g. "day", "week", "month", "year"]`
* `periodRange` **string** _required_: period to consider `[e.g. "day", "week", "month", "year"]`

###### Example usage

Now is "2016-10-14"

```js
getTimeRangeByPeriod("week", "day")

--> {
    start: "2016-10-07T00:00:00.000Z",
    end: "2016-10-07T23:59:59.999Z"
}
```

#### getSumByPeriod(period, aggregates, measurementValuesByPeriod)

###### Arguments

* `period` **object** _required_: period object with start and end keys
* `aggregates` **Immutable.Map** _required_: aggregate yearly-consumption
* `measurementValuesByPeriod` **array** _optional_: array of measurementValues

###### Example usage

```js
const yearlyAggregates = {
    _id: "sensorId-2016-reading-activeEnergy",
    year: "2016",
    sensorId: "sensorId",
    source: "reading",
    measurementType: "activeEnergy",
    measurementValues: "1,2,3,4,4,9,5,6,4,6,3,2,3",
    unitOfMeasurement: "kWh"
}

const period = {
    start: "2016-01-04T00:00:00.000Z",
    end: "2016-01-10T23:59:59.999Z"
}
```

```js
getSumByPeriod(period, yearlyAggregates) --> 38
```

#### getAverageByPeriod (aggregates, offsetPeriod, offsetNumber)

###### Arguments

* `aggregates` **Immutable.Map** _required_: aggregate yearly-consumption
* `offsetPeriod` **string** _required_: period to consider `[e.g. "day", "week", "month"]`
* `offsetNumber` **array** _optional_: how frequently take the selected offsetPeriod [default value: 1]

###### Example usage

Now is "2016-01-17"

```js
const yearlyAggregates = {
    _id: "sensorId-2016-reading-activeEnergy",
    year: "2016",
    sensorId: "sensorId",
    source: "reading",
    measurementType: "activeEnergy",
    measurementValues: "1,2,3,4,4,9,5,6,4,6,3,2,3,1,6,7,5",
    unitOfMeasurement: "kWh"
}

const offsetPeriod = "day";
const offsetNumber = 7;
```

```js
getAverageByPeriod (aggregates, offsetPeriod, offsetNumber) --> 4.5
```
