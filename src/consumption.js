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

/*
*   Public function
*/

/**
*   @param {string} period - period of the time range
*
*   @return {object}
*/
export function getTimeRangeByPeriod (period) {
    const now = moment.utc();
    return {
        start: now.startOf(period).toISOString(),
        end: now.endOf(period).toISOString()
    };
}

/**
*   @param {string} periodToSubtract - period to subtract from now
*   @param {string} periodRange - period to consider
*
*   @return {object}
*/
export function getPreviousPeriod (periodToSubtract, periodRange) {
    return {
        start: moment.utc().subtract(1, periodToSubtract).startOf(periodRange).toISOString(),
        end: moment.utc().subtract(1, periodToSubtract).endOf(periodRange).toISOString()
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
