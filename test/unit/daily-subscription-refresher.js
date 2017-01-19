import {expect} from "chai";
import {subscribeDaily} from "daily-subscription-refresher";

describe("`subscribeDaily` function", () => {
    it("invokes parameter function immediately", () => {
        var i = 0;
        const func = () => i++;
        subscribeDaily(func);
        expect(i).to.deep.equal(1);
        subscribeDaily(func);
        expect(i).to.deep.equal(2);
    });
});