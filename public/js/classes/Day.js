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
var _Day_number, _Day_visitorGoal, _Day_activeRules, _Day_introMessage;
export class Day {
    constructor(number, visitorGoal, activeRules, introMessage) {
        _Day_number.set(this, void 0);
        _Day_visitorGoal.set(this, void 0);
        _Day_activeRules.set(this, void 0);
        _Day_introMessage.set(this, void 0);
        __classPrivateFieldSet(this, _Day_number, number, "f");
        __classPrivateFieldSet(this, _Day_visitorGoal, visitorGoal, "f");
        __classPrivateFieldSet(this, _Day_activeRules, activeRules, "f");
        __classPrivateFieldSet(this, _Day_introMessage, introMessage, "f");
    }
    getNumber() {
        return __classPrivateFieldGet(this, _Day_number, "f");
    }
    getVisitorGoal() {
        return __classPrivateFieldGet(this, _Day_visitorGoal, "f");
    }
    getActiveRules() {
        return __classPrivateFieldGet(this, _Day_activeRules, "f");
    }
    getIntroMessage() {
        return __classPrivateFieldGet(this, _Day_introMessage, "f");
    }
    evaluateCharacter(character) {
        const violatedRule = __classPrivateFieldGet(this, _Day_activeRules, "f").find((rule) => rule.isViolated(character));
        if (violatedRule === undefined) {
            return null;
        }
        return violatedRule;
    }
}
_Day_number = new WeakMap(), _Day_visitorGoal = new WeakMap(), _Day_activeRules = new WeakMap(), _Day_introMessage = new WeakMap();
//# sourceMappingURL=Day.js.map