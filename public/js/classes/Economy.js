var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Economy_dayCharge, _Economy_lastDayCharge, _Economy_usedExtraTimeToday, _Economy_hasInsurance;
const EXTRA_TIME_COST = 5;
const INSURANCE_COST = 8;
export class Economy {
    constructor() {
        _Economy_dayCharge.set(this, void 0);
        _Economy_lastDayCharge.set(this, void 0);
        _Economy_usedExtraTimeToday.set(this, void 0);
        _Economy_hasInsurance.set(this, void 0);
        __classPrivateFieldSet(this, _Economy_dayCharge, 0, "f");
        __classPrivateFieldSet(this, _Economy_lastDayCharge, 0, "f");
        __classPrivateFieldSet(this, _Economy_usedExtraTimeToday, false, "f");
        __classPrivateFieldSet(this, _Economy_hasInsurance, false, "f");
    }
    get extraTimeCost() {
        return EXTRA_TIME_COST;
    }
    get insuranceCost() {
        return INSURANCE_COST;
    }
    get usedExtraTimeToday() {
        return __classPrivateFieldGet(this, _Economy_usedExtraTimeToday, "f");
    }
    get hasInsurance() {
        return __classPrivateFieldGet(this, _Economy_hasInsurance, "f");
    }
    get lastDayCharge() {
        return __classPrivateFieldGet(this, _Economy_lastDayCharge, "f");
    }
    chargeDailyCost(activeRulesCount) {
        const cost = 2 + activeRulesCount;
        __classPrivateFieldSet(this, _Economy_dayCharge, cost, "f");
        return cost;
    }
    consumeInsuranceIfActive() {
        if (!__classPrivateFieldGet(this, _Economy_hasInsurance, "f")) {
            return false;
        }
        __classPrivateFieldSet(this, _Economy_hasInsurance, false, "f");
        return true;
    }
    tryBuyExtraTime(availableMoney) {
        if (availableMoney < EXTRA_TIME_COST || __classPrivateFieldGet(this, _Economy_usedExtraTimeToday, "f")) {
            return 0;
        }
        __classPrivateFieldSet(this, _Economy_usedExtraTimeToday, true, "f");
        return EXTRA_TIME_COST;
    }
    tryBuyInsurance(availableMoney) {
        if (availableMoney < INSURANCE_COST || __classPrivateFieldGet(this, _Economy_hasInsurance, "f")) {
            return 0;
        }
        __classPrivateFieldSet(this, _Economy_hasInsurance, true, "f");
        return INSURANCE_COST;
    }
    resetForNewDay() {
        __classPrivateFieldSet(this, _Economy_usedExtraTimeToday, false, "f");
        __classPrivateFieldSet(this, _Economy_hasInsurance, false, "f");
    }
    snapshotDayEnd() {
        __classPrivateFieldSet(this, _Economy_lastDayCharge, __classPrivateFieldGet(this, _Economy_dayCharge, "f"), "f");
    }
}
_Economy_dayCharge = new WeakMap(), _Economy_lastDayCharge = new WeakMap(), _Economy_usedExtraTimeToday = new WeakMap(), _Economy_hasInsurance = new WeakMap();
//# sourceMappingURL=Economy.js.map