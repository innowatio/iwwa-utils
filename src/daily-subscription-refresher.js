import moment from "moment";

var runningInterval;

export function subscribeDaily (subscription) {
    subscription();
    clearInterval(runningInterval);
    const msTillNewDay = moment().endOf("day").diff(moment());
    runningInterval = setInterval(() => this.subscribeDaily(subscription), msTillNewDay);
}