import BigNumber from "big.js";
import {Map} from "immutable";
import isEmpty from "lodash.isempty";
import isObject from "lodash.isobject";
import range from "lodash.range";
import moment from "moment";

import IwwaUtilsError from "./lib/iwwa-utils-error";

/*
*   Private function
*/

/**
*   @param {string} startYear - year when init period
*   @param {string} endYear - year when end period
*   @param {object} period - period object with start and end key
*   @param {object} measure - object of measurement
*
*   @return {array}
*/
function getMeasurementValues (startYear, endYear, period, measure) {
    const startPeriodDay = moment.utc(period.start).dayOfYear();
    const endPeriodDay = moment.utc(period.end).dayOfYear();
    if (startYear === endYear) {
        return measure.measurementValues.slice(startPeriodDay - 1, endPeriodDay);
    }
    if (measure.year === endYear) {
        return measure.measurementValues.slice(0, endPeriodDay);
    }
    if (measure.year === startYear) {
        return measure.measurementValues.slice(startPeriodDay - 1, measure.measurementValues.length);
    }
}

/**
*   @param {object} period - period object with start and end key
*   @param {object} measure - object of measurement
*
*   @return {array}
*/
function getMeasurementValuesToNow (period, measure) {
    const startPeriod = moment.utc(period.start).valueOf();
    const endPeriod = moment.utc(period.end).valueOf();
    const {measurementTimes, measurementValues} = measure;
    var result = [];
    for (var x=0; x <= measurementTimes.length; x++) {
        if (parseInt(measurementTimes[x]) <= endPeriod && parseInt(measurementTimes[x]) >= startPeriod) {
            result.push(parseFloat(measurementValues[x]));
        }
    }
    return result;
}

/**
*   @param {object} period - period object with start and end key
*   @param {Immutable.Map} measure - yearly-consumption aggregate of value
*
*   @return {array}
*/
function getMeasurementValuesByPeriod (period, aggregates) {
    const startYear = `${moment.utc(period.start).year()}`;
    const endYear = `${moment.utc(period.end).year()}`;
    return aggregates
        // filter over the year in selected period
        .filter(agg => agg.get("year") === startYear || agg.get("year") === endYear)
        // creates an array of object for different years
        .map(agg => ({
            year: agg.get("year"),
            measurementValues: agg.get("measurementValues").split(",")
        }))
        // create an array of values to sum in selected period
        .reduce((acc, measure) => {
            const measurementValues = getMeasurementValues(startYear, endYear, period, measure);
            return acc.concat(measurementValues);
        }, []);
}

/**
*   @param {object} period - period object with start and end key
*   @param {Immutable.Map} measure - daily-consumption aggregate of value
*
*   @return {array}
*/

function getMeasurementValuesByPeriodToNow (period, aggregates) {
    const firstAggregate = aggregates.first() || Map();
    const sensorId = firstAggregate.get("sensorId");
    if (!sensorId) {
        return [];
    }
    const numberOfDays = parseInt(moment.utc(period.end).diff(period.start, "days")) + 1;
    const days = numberOfDays !== 0 ? range(0, numberOfDays).map(idx => {
        return moment.utc(period.start).add({days: idx}).format("YYYY-MM-DD");
    }) : [];
    return days.map(day => {
        const aggregate = aggregates.get(`${sensorId}-${day}-reading-activeEnergy`);
        return aggregate ? {
            year: aggregate.get("day"),
            measurementTimes: aggregate.get("measurementTimes").split(","),
            measurementValues: aggregate.get("measurementValues").split(",")
        } : null;
    })
    .filter(day => day)
    // create an array of values to sum in selected period (day, hour)
    .reduce((acc, measure) => {
        const measurementValues = getMeasurementValuesToNow(period, measure);
        return acc.concat(measurementValues);
    }, []);
}

/*
*   Public function
*/

/**
*   @param {string} period - period of the time range
*   @param {boolean} isToNow - define if the end of period is the courrent type (isToNow = true) or the end of the day (default)
*
*   @return {object}
*/
export function getTimeRangeByPeriod (period, isToNow = false) {
    return isToNow ? {
        start: moment.utc().startOf(period).toISOString(),
        end: moment.utc().toISOString()
    }:{
        start: moment.utc().startOf(period).toISOString(),
        end: moment.utc().endOf(period).toISOString()
    };
}

/**
*   @param {string} periodToSubtract - period to subtract from now
*   @param {string} periodRange - period to consider
*   @param {boolean} isToNow - define if the end of period is the courrent type (isToNow = true) or the end of the day (default)
*   @param {number} offsetNumber - how frequently take the selected offsetPeriod
*
*   @return {object}
*/
export function getPreviousPeriod (periodToSubtract, periodRange, isToNow = false, offsetNumber = 1) {
    return isToNow ?{
        start: moment.utc().subtract(offsetNumber, periodToSubtract).startOf(periodRange).toISOString(),
        end: moment.utc().subtract(offsetNumber, periodToSubtract).toISOString()
    }:{
        start: moment.utc().subtract(offsetNumber, periodToSubtract).startOf(periodRange).toISOString(),
        end: moment.utc().subtract(offsetNumber, periodToSubtract).endOf(periodRange).toISOString()
    };
}

/**
*   @param {object} period - {start: "YYYY-MM-DDTHH:mm:ssZ", end: "YYYY-MM-DDTHH:mm:ssZ"}
*   @param {Immutable.Map} aggregates - the yearly-consumption
*   @param {array} measurementValuesByPeriod - array of measurementValues
*
*   @return {number}
*/
export function getSumByPeriod (period, aggregates, measurementValuesByPeriod) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("[getSumByPeriod]: collections should be immutable.js");
    }
    // Period should be an object
    if (!isObject(period)) {
        throw new IwwaUtilsError("[getSumByPeriod]: period should be an Object");
    }
    // get the values to sum
    const measurementValues = (
        measurementValuesByPeriod ?
        measurementValuesByPeriod :
        getMeasurementValuesByPeriod(period, aggregates)
    );
    //  make sum of the values in array;
    return parseFloat(measurementValues.reduce((acc, value) => acc.plus(value || 0), new BigNumber(0)));
}

/**
*   @param {object} period - {start: "YYYY-MM-DDTHH:mm:ssZ", end: "YYYY-MM-DDTHH:mm:ssZ"}
*   @param {Immutable.Map} aggregates - the daily-consumption
*   @param {array} measurementValuesByPeriod - array of measurementValues
*
*   @return {number}
*/
export function getSumByPeriodToNow (period, aggregates, measurementValuesByPeriod) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("[getSumByPeriodToNow]: collections should be immutable.js");
    }
    // Period should be an object
    if (!isObject(period)) {
        throw new IwwaUtilsError("[getSumByPeriodToNow]: period should be an Object");
    }
    // get the values to sum
    const measurementValues = (
        measurementValuesByPeriod ?
        measurementValuesByPeriod :
        getMeasurementValuesByPeriodToNow(period, aggregates)
    );
    //  make sum of the values in array;
    return parseFloat(measurementValues.reduce((acc, value) => acc.plus(value || 0), new BigNumber(0)));
}

/**
*   @param {Immutable.Map} aggregates - the yearly-consumption
*
*   @return {number}
*/
export function getAverageByYear (aggregates) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("[getAverageByYear]: collections should be immutable.js");
    }

    const numberOfYears = aggregates.size;
    var values =[];
    aggregates.map(index => {
        const measures = index.get("measurementValues").split(",");
        values = values.concat(measures);
    });

    //  make average by years (numberOfYears) of the values in array;
    const sumOfYears = values.reduce((acc, value) => acc.plus(value || 0), new BigNumber(0));
    return parseFloat(sumOfYears.div(numberOfYears || 1).round(2));
}


/**
*   @param {Immutable.Map} aggregates - the yearly-consumption
*   @param {string} offsetPeriod - offsetPeriod to take ["day", "week", "month"]
*   @param {number} offsetNumber - how frequently take the selected offsetPeriod
*
*   @return {number}
*/
export function getAverageByPeriod (aggregates, offsetPeriod, offsetNumber = 1) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("[getAverageByPeriod]: collections should be immutable.js");
    }
    const year = moment().year();
    const numberOfPeriodInPastYear = moment([year]).diff(moment([year - 1]), offsetPeriod, true);
    const rangeToIterate = parseInt(numberOfPeriodInPastYear / offsetNumber);
    const sumsByPeriod = range(1, rangeToIterate + 1)
        // Calculate the sum for all the selected period
        .map(index => {
            const period = {
                start: moment.utc().subtract({[offsetPeriod]: index * offsetNumber}).startOf(offsetPeriod).toISOString(),
                end: moment.utc().subtract({[offsetPeriod]: index * offsetNumber}).endOf(offsetPeriod).toISOString()
            };
            const measurementValuesByPeriod = getMeasurementValuesByPeriod(period, aggregates);
            // If in a period there is a day without data, return NaN
            if (isEmpty(measurementValuesByPeriod) || measurementValuesByPeriod.indexOf("") >= 0) {
                return NaN;
            }
            return getSumByPeriod(period, aggregates, measurementValuesByPeriod);
        })
        // Filter all NaN. If a day in a period has consumption equal to NaN,
        // all that period is considered without data
        .filter(value => !isNaN(value));
    const average = sumsByPeriod
        .reduce((acc, value) => acc.plus(value || 0), new BigNumber(0))
        .div(sumsByPeriod.length || 1)
        .round(2);
    return parseFloat(average);
}

/**
*   @param {Immutable.Map} aggregates - the daily-consumption
*   @param {string} offsetPeriod - offsetPeriod to take ["day", "week", "month"]
*   @param {number} offsetNumber - how frequently take the selected offsetPeriod
*
*   @return {number}
*/
export function getAverageByPeriodToNow (aggregates, offsetPeriod, offsetNumber = 1) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("[getAverageByPeriodToNow]: collections should be immutable.js");
    }
    const year = moment().year();
    const numberOfPeriodInPastYear = moment([year]).diff(moment([year - 1]), offsetPeriod, true);
    const rangeToIterate = parseInt(numberOfPeriodInPastYear / offsetNumber);
    const sumsByPeriod = range(1, rangeToIterate + 1)
        // Calculate the sum for all the selected period
        .map(index => {
            const period = {
                start: moment.utc().subtract({[offsetPeriod]: index * offsetNumber}).startOf(offsetPeriod).toISOString(),
                end: moment.utc().subtract({[offsetPeriod]: index * offsetNumber}).toISOString()
            };
            const measurementValuesByPeriod = getMeasurementValuesByPeriodToNow(period, aggregates);
            // If in a period there is a day without data, return NaN
            if (isEmpty(measurementValuesByPeriod) || measurementValuesByPeriod.indexOf("") >= 0) {
                return NaN;
            }
            return getSumByPeriodToNow(period, aggregates, measurementValuesByPeriod);
        })
        // Filter all NaN. If a day in a period has consumption equal to NaN,
        // all that period is considered without data
        .filter(value => !isNaN(value));
    const average = sumsByPeriod
        .reduce((acc, value) => acc.plus(value || 0), new BigNumber(0))
        .div(sumsByPeriod.length || 1)
        .round(2);
    return parseFloat(average);
}
