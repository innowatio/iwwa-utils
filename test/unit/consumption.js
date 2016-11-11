import {expect} from "chai";
import {Map, fromJS} from "immutable";
import moment from "moment";
import sinon from "sinon";

import IwwaUtilsError from "lib/iwwa-utils-error";
import {getTimeRangeByPeriod, getPreviousPeriod, getSumByPeriod, getAverageByPeriod} from "consumption";

describe("`consumption` utils", () => {

    var clock;

    before(() => {
        clock = sinon.useFakeTimers(new Date("2016-10-14").getTime());
    });

    beforeEach(() => {
        moment.locale("en");
    });

    after(() => {
        clock.restore();
    });

    const aggregates = fromJS({
        "sensorId-2016-reading-activeEnergy": {
            _id: "sensorId-2016-reading-activeEnergy",
            year: "2016",
            sensorId: "sensorId",
            source: "reading",
            measurementType: "activeEnergy",
            measurementValues: "1.5890,4.2666,8.0080,4.4356,4.0122,5.2029,0.7111,3.4938,8.2597,6.7033,3.2589,1.1621,5.7822,8.2262,0.3119,8.8693,1.6210,7.2121,8.5685,0.1268,9.8020,9.8327,1.6459,9.1799,4.4222,4.1323,9.4724,5.2301,7.1423,0.1640,2.7794,7.3588,5.6097,3.4733,5.8776,5.3861,2.4108,9.1346,8.4757,3.0990,0.2913,7.1921,7.5182,1.1572,6.6325,5.8331,9.6489,2.5231,4.5174,0.1572,8.9085,8.6338,6.3506,6.7340,8.5048,9.0188,7.7472,3.1838,5.4535,4.0565,6.1893,3.6471,4.9289,1.0840,8.1091,5.1701,2.0888,7.1516,9.8025,0.8005,8.8908,9.7259,5.6919,7.2312,1.0132,2.9695,6.6756,5.3844,3.0359,1.1203,6.2933,7.6874,6.1108,5.1649,2.1628,4.7824,5.2571,7.5306,3.3374,9.0942,4.3577,7.3779,2.0311,3.7533,3.8946,9.3205,2.0795,5.2925,7.9840,6.9398,1.2238,0.0556,1.0972,3.0864,0.6961,8.8075,6.1859,0.7215,8.4526,0.3609,9.3876,7.8093,9.6919,1.1897,2.2705,0.2880,8.1476,1.6958,8.5325,2.1420,9.6323,0.5270,2.0121,2.9123,7.1783,5.4168,2.0351,3.9191,7.2013,7.9228,0.4255,6.8294,2.6967,6.7587,9.2156,6.8680,0.2665,7.0652,5.4643,2.8725,1.0327,8.0097,6.7799,8.6657,9.6258,4.5646,0.0628,9.9468,5.8856,5.8461,1.1625,2.4566,4.2134,2.3745,2.7043,9.5669,6.6199,8.2073,2.3173,4.5821,6.2789,6.1069,5.1641,5.9816,0.9322,5.1297,8.6188,7.9670,5.6153,0.5430,5.9749,5.6648,5.8971,2.1586,1.0827,1.0644,2.7235,5.7901,3.7787,3.3766,8.8412,9.4152,8.5628,6.8278,9.0473,6.1042,6.1466,3.2254,0.6899,4.5731,1.5421,2.6173,1.9902,2.0123,1.0838,6.8840,4.8185,9.8741,0.5026,3.0833,1.8680,6.7508,8.0458,6.9167,5.0096,6.4112,2.6615,2.3797,8.2128,2.0182,5.7763,6.2355,3.8325,3.3296,1.8581,8.4699,1.8343,1.5340,2.9653,5.9907,6.7934,2.1979,8.6963,1.4145,1.7124,6.1065,9.4146,8.6965,4.1505,9.3425,3.8294,1.4489,3.2196,6.6184,0.5784,2.9791,7.7470,8.1732,0.6477,6.4170,9.6251,8.4555,0.0505,2.8496,3.2752,2.1392,2.7957,1.6862,4.8443,1.6252,6.5623,0.6790,9.2817,2.2196,3.5559,7.2260,7.4992,0.2729,5.8472,2.6032,9.3274,1.3645,9.8094,2.4538,1.5885,9.1572,0.0334,8.4229,7.4035,3.2648,3.1723,0.2130,,,1.0487,5.3211,9.1130,8.0806,3.0497,,6.1393,0.1146,9.4024,,2.9575,9.0386,7.2219,9.5830",
            unitOfMeasurement: "kWh"
        }, "sensorId-2015-reading-activeEnergy": {
            _id: "sensorId-2015-reading-activeEnergy",
            year: "2015",
            sensorId: "sensorId",
            source: "reading",
            measurementType: "activeEnergy",
            measurementValues: "5.0,8.1,0.5,7.5,0.1,1.4,9.4,5.0,5.2,7.7,6.8,9.9,7.4,2.4,6.0,9.8,5.1,5.2,0.4,1.3,4.9,0.6,2.9,7.8,7.7,6.6,0.2,10.0,1.8,8.1,3.4,2.8,3.7,2.3,9.5,0.2,9.5,4.7,0.1,8.7,8.2,3.4,3.2,6.8,9.7,7.5,7.2,1.2,7.3,1.4,1.2,4.7,2.5,5.3,8.0,9.7,0.1,4.4,4.5,5.8,2.1,9.1,4.0,4.1,1.9,0.4,10.0,1.1,0.6,9.5,7.9,1.5,8.2,7.0,7.7,6.3,1.5,2.9,6.2,8.6,2.0,9.3,5.0,2.8,6.5,7.5,4.0,4.0,1.2,1.4,4.6,5.6,9.0,9.2,5.1,6.9,5.2,6.3,1.4,6.4,1.5,4.7,3.4,1.3,4.0,7.5,0.9,9.8,2.7,1.1,5.8,5.5,4.3,5.3,8.1,6.0,9.4,8.3,1.4,6.5,0.1,5.9,3.7,9.6,8.7,5.8,3.4,1.9,8.6,6.8,0.9,6.3,7.8,6.7,1.9,0.1,5.4,1.6,1.0,2.6,6.6,5.4,2.9,9.3,8.8,1.1,0.6,5.6,2.6,9.3,9.6,6.5,2.7,1.5,2.6,9.9,6.4,1.3,6.5,5.9,9.4,4.9,6.0,6.0,6.7,2.5,5.4,9.5,1.6,3.9,2.8,2.7,4.2,9.1,6.4,0.9,6.2,4.5,4.0,3.6,2.6,1.9,3.7,5.0,1.8,6.3,4.6,2.4,9.4,7.1,0.1,1.4,8.7,5.9,4.7,2.0,9.4,7.5,6.1,7.0,8.1,8.4,4.3,3.8,6.5,8.4,7.1,1.5,3.0,9.1,9.2,9.1,9.7,3.5,5.8,4.7,0.3,5.7,6.6,6.3,6.8,4.1,7.2,4.4,6.0,6.1,3.7,3.4,7.6,0.5,9.7,9.5,4.9,4.8,8.0,8.7,6.2,0.3,6.1,0.5,4.8,3.2,6.7,7.8,4.4,7.8,1.1,5.0,9.1,8.5,2.8,6.0,4.7,6.2,3.8,3.0,1.4,7.9,9.1,1.9,6.3,4.9,1.6,6.2,7.0,1.1,6.5,0.2,5.1,0.3,4.2,2.7,8.9,2.5,5.8,0.0,2.5,4.9,1.7,2.9,3.5,8.3,4.3,8.0,8.2,9.6,1.4,8.1,2.5,0.1,4.5,8.7,9.7,7.0,9.5,7.6,9.5,6.3,6.0,3.4,3.5,7.5,7.3,8.9,3.4,9.6,6.6,3.6,2.7,2.0,6.5,0.2,0.0,3.7,8.4,5.9,9.0,7.7,0.6,9.9,6.5,3.7,6.5,1.5,2.8,6.3,9.1,9.9,1.4,2.4,7.7,6.6,1.2,3.2,1.7,9.4,0.2,2.3,0.0,2.4,4.0,0.4,3.6,1.4,5.6,2.3,0.1,0.0,1.5,9.0,9.2,6.8,2.3,2.7,5.7,2.7,2.8,6.0,3.2,8.2,1.7,0.9,2.7,9.9,2.4",
            unitOfMeasurement: "kWh"
        }
    });

    describe("`getTimeRangeByPeriod` function", () => {

        it("returns an object of correct period range [CASE: period is `day`]", () => {
            const ret = getTimeRangeByPeriod("day");
            expect(ret).to.deep.equal({
                start: "2016-10-14T00:00:00.000Z",
                end: "2016-10-14T23:59:59.999Z"
            });
        });


        it("returns an object of correct period range [CASE: period is `week` and locale `it`]", () => {
            moment.locale("it");
            const ret = getTimeRangeByPeriod("week");
            expect(ret).to.deep.equal({
                start: "2016-10-10T00:00:00.000Z",
                end: "2016-10-16T23:59:59.999Z"
            });
        });

        it("returns an object of correct period range [CASE: period is `week` with default locale]", () => {
            const ret = getTimeRangeByPeriod("week");
            expect(ret).to.deep.equal({
                start: "2016-10-09T00:00:00.000Z",
                end: "2016-10-15T23:59:59.999Z"
            });
        });

        it("returns an object of correct period range [CASE: period is `month`]", () => {
            const ret = getTimeRangeByPeriod("month");
            expect(ret).to.deep.equal({
                start: "2016-10-01T00:00:00.000Z",
                end: "2016-10-31T23:59:59.999Z"
            });
        });

        it("returns an object of correct period range [CASE: period is `year`]", () => {
            const ret = getTimeRangeByPeriod("year");
            expect(ret).to.deep.equal({
                start: "2016-01-01T00:00:00.000Z",
                end: "2016-12-31T23:59:59.999Z"
            });
        });

    });

    describe("`getPreviousPeriod` function", () => {

        it("return an object with correct period [CASE: yesterday, period is `day`]", () => {
            const subtractPeriod = "day";
            const rangePeriod = "day";
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2016-10-13T00:00:00.000Z",
                end: "2016-10-13T23:59:59.999Z"
            });
        });

        it("return an object with correct period [CASE: past week, period is `day`]", () => {
            const subtractPeriod = "week";
            const rangePeriod = "day";
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2016-10-07T00:00:00.000Z",
                end: "2016-10-07T23:59:59.999Z"
            });
        });

        it("return an object with correct period [CASE: past week, period is `week`]", () => {
            const subtractPeriod = "week";
            const rangePeriod = "week";
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2016-10-02T00:00:00.000Z",
                end: "2016-10-08T23:59:59.999Z"
            });
        });

        it("return an object with correct period [CASE: past week, period is `week`, moment localized in `it`]", () => {
            const subtractPeriod = "week";
            const rangePeriod = "week";
            moment.locale("it");
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2016-10-03T00:00:00.000Z",
                end: "2016-10-09T23:59:59.999Z"
            });
        });

        it("return an object with correct period [CASE: past month, period is `month`]", () => {
            const subtractPeriod = "month";
            const rangePeriod = "month";
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2016-09-01T00:00:00.000Z",
                end: "2016-09-30T23:59:59.999Z"
            });
        });

        it("return an object with correct period [CASE: past year, period is `month`]", () => {
            const subtractPeriod = "year";
            const rangePeriod = "month";
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2015-10-01T00:00:00.000Z",
                end: "2015-10-31T23:59:59.999Z"
            });
        });

        it("return an object with correct period [CASE: past year, period is `year`]", () => {
            const subtractPeriod = "year";
            const rangePeriod = "year";
            const ret = getPreviousPeriod(subtractPeriod, rangePeriod);
            expect(ret).to.deep.equal({
                start: "2015-01-01T00:00:00.000Z",
                end: "2015-12-31T23:59:59.999Z"
            });
        });

    });

    describe("`getSumByPeriod` function", () => {

        it("throw an `IwwaUtilsError` if aggregates is not an Immutable.Map", () => {
            const aggregatesObject = {
                _id: "sensorId-year-source-measurementType",
                year: "YYYY",
                sensorId: "sensorId",
                source: "reading",
                measurementType: "activeEnergy",
                measurementValues: "",
                unitOfMeasurement: ""
            };
            function troublemaker () {
                getSumByPeriod("week", aggregatesObject);
            }
            expect(troublemaker).to.throw(IwwaUtilsError);
        });

        it("throw an `IwwaUtilsError` if period is not an object", () => {
            function troublemaker () {
                getSumByPeriod("period", Map());
            }
            expect(troublemaker).to.throw(IwwaUtilsError);
        });

        it("return the sum of consumption of today", () => {
            const period = {
                start: "2016-10-14T00:00:00.000Z",
                end: "2016-10-14T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(9.5830);
        });

        it("return the sum of consumption of yesterday ", () => {
            const period = {
                start: "2016-10-13T00:00:00.000Z",
                end: "2016-10-13T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(7.2219) ;
        });

        it("return the sum of consumption of same day a week ago", () => {
            const period = {
                start: "2016-10-07T00:00:00.000Z",
                end: "2016-10-07T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(6.1393) ;
        });

        it("return the sum of consumption of past week [CASE: week from 2016-10-03 to 2016-10-09]", () => {
            const period = {
                start: "2016-10-08T00:00:00.000Z",
                end: "2016-10-14T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(38.318) ;
        });

        it("return the sum of consumption of past week [CASE: week from 2015-12-08 to 2016-01-14]", () => {
            const period = {
                start: "2015-12-28T00:00:00.000Z",
                end: "2016-01-03T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(29.7636) ;
        });

        it("return the sum of consumption of past month", () => {
            const period = {
                start: "2016-10-01T00:00:00.000Z",
                end: "2016-10-31T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(71.0704) ;
        });

        it("return the sum of consumption of past month a year ago", () => {
            const period = {
                start: "2015-10-01T00:00:00.000Z",
                end: "2015-10-31T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(173.7) ;
        });

        it("return the sum of consumption of the year [CASE: 2015]", () => {
            const period = {
                start: "2015-01-01T00:00:00.000Z",
                end: "2015-12-31T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(1818.3) ;
        });

        it("return the sum of consumption of the year [CASE: 2016]", () => {
            const period = {
                start: "2016-01-01T00:00:00.000Z",
                end: "2016-12-31T23:59:59.999Z"
            };
            const ret = getSumByPeriod(period, aggregates);
            expect(ret).to.equal(1405.7108) ;
        });

    });

    describe("`getAverageByPeriod` function", () => {

        it("throw an `IwwaUtilsError` if aggregates is not an Immutable.Map", () => {
            const aggregatesObject = {
                _id: "sensorId-year-source-measurementType",
                year: "YYYY",
                sensorId: "sensorId",
                source: "reading",
                measurementType: "activeEnergy",
                measurementValues: "",
                unitOfMeasurement: ""
            };
            function troublemaker () {
                getAverageByPeriod(aggregatesObject, "day", 7);
            }
            expect(troublemaker).to.throw(IwwaUtilsError);
        });

        it("return the average of the same day of the week consumption for one year of data", () => {
            const ret = getAverageByPeriod(aggregates, "day", 7);
            expect(ret).to.equal(4.78);
        });

        it("return the average of the weekly consumption for one year of data [CASE: locale `it`]", () => {
            moment.locale("it");
            const ret = getAverageByPeriod(aggregates, "week");
            expect(ret).to.equal(34.34);
        });

        it("return the average of the weekly consumption for one year of data", () => {
            const ret = getAverageByPeriod(aggregates, "week");
            expect(ret).to.equal(34.35);
        });

        it("return the average of the monthly consumption for one year of data", () => {
            const ret = getAverageByPeriod(aggregates, "month");
            expect(ret).to.equal(149.97);
        });

        it("return the average of the monthly consumption for one year of data", () => {
            const agg = fromJS({
                "sensor1-2016-reading-activeEnergy": {
                    "_id" : "sensor1-2016-reading-activeEnergy",
                    "year" : "2016",
                    "sensorId" : "sensor1",
                    "source" : "reading",
                    "measurementType" : "activeEnergy",
                    "measurementValues" : ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,8.642,24.441,22.11,28.75,56.524,88.239,109.615,14.628,22.565,41.896,21.093,24.565,25.738,25.465,29.389,29.901,27.603,60.892,62.112,11.562,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0",
                    "unitOfMeasurement" : "kWh",
                    "measurementsDeltaInMs" : 86400000
                }
            });
            const ret = getAverageByPeriod(agg, "month");
            expect(ret).to.equal(0);
        });


    });

});
