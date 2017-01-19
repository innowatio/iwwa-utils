import moment from "moment";

var nextDaysIntervals = [];

export function subscribeDaily (subscription) {
    subscribeNow(subscription);
    subscribeNextDay(subscription);
}

function subscribeNow (subscription) {
    subscription();
}

function subscribeNextDay (subscription) {
    nextDaysIntervals.push(setInterval(() => subscribeEveryDays(subscription), getMsTillNewDay()));
}

function subscribeEveryDays (subscription) {
    nextDaysIntervals.shift();
    setInterval(subscription, 86400000);

}

function getMsTillNewDay () {
    return moment().endOf("day").diff(moment());
}
