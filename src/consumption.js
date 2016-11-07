import BigNumber from "bignumber.js";
import {Map} from "immutable";
import isEmpty from "lodash.isempty";
import isObject from "lodash.isobject";
import range from "lodash.range";
import moment from "moment";

import IwwaUtilsError from "./lib/iwwa-utils-error";

/**
*   @param {string} period - period of the time range
*   example possible period: "day", "week", "month", "year"
*/
export function getTimeRangeByPeriod (period) {
    const now = moment.utc();
    return {
        start: now.startOf(period).toISOString(),
        end: now.endOf(period).toISOString()
    };
}

/**
*   @param {string} subtractPeriod - period to subtract from now
*   @param {string} rangePeriod - period to consider
*   example possible period: "day", "week", "month", "year"
*/
export function getPreviousPeriod (subtractPeriod, rangePeriod) {
    return {
        start: moment.utc().subtract(1, subtractPeriod).startOf(rangePeriod).toISOString(),
        end: moment.utc().subtract(1, subtractPeriod).endOf(rangePeriod).toISOString()
    };
}

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
*   @param {object} period - {start: "YYYY-MM-DDTHH:mm:ssZ", end: "YYYY-MM-DDTHH:mm:ssZ"}
*   @param {Map} aggregates - the yearly-consumption
*       DB structure:
*       {
*           _id: "sensorId-year-source-measurementType",
*           year: "YYYY",
*           sensorId: "sensorId",
*           source: "reading",
*           measurementType: "activeEnergy",
*           measurementValues: "",
*           unitOfMeasurement: ""
*       }
*
*   @return {number} sumByPeriod - return the sum of consumption in selected period
*/
export function getSumByPeriod (period, aggregates, measurementValuesByPeriod) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("collections should be immutable.js");
    }
    // Period should be an object
    if (!isObject(period)) {
        throw new IwwaUtilsError("period should be an Object");
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
*   @param {Map} aggregates - the yearly-consumption
*       DB structure:
*       {
*           _id: "sensorId-year-source-measurementType",
*           year: "YYYY",
*           sensorId: "sensorId",
*           source: "reading",
*           measurementType: "activeEnergy",
*           measurementValues: "",
*           unitOfMeasurement: ""
*       }
*   @param {string} offsetPeriod - offsetPeriod to take ["day", "week", "month"]
*   @param {number} offsetNumber - how frequently take the selected offsetPeriod
*
*   @return {number} averageByPeriod - return the average of consumption in selected period
*/
export function getAverageByPeriod (aggregates, offsetPeriod, offsetNumber = 1) {
    // The aggregates should be an Immutable.js.
    if (!Map.isMap(aggregates)) {
        throw new IwwaUtilsError("collections should be immutable.js");
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
        .dividedBy(sumsByPeriod.length)
        .round(2);
    return parseFloat(average);
}
