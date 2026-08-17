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
var _Rule_day, _Rule_property, _Rule_forbiddenValue, _Rule_description;
export class Rule {
    constructor(day, property, forbiddenValue, description) {
        _Rule_day.set(this, void 0);
        _Rule_property.set(this, void 0);
        _Rule_forbiddenValue.set(this, void 0);
        _Rule_description.set(this, void 0);
        __classPrivateFieldSet(this, _Rule_day, day, "f");
        __classPrivateFieldSet(this, _Rule_property, property, "f");
        __classPrivateFieldSet(this, _Rule_forbiddenValue, forbiddenValue, "f");
        __classPrivateFieldSet(this, _Rule_description, description, "f");
    }
    getDay() {
        return __classPrivateFieldGet(this, _Rule_day, "f");
    }
    getProperty() {
        return __classPrivateFieldGet(this, _Rule_property, "f");
    }
    getForbiddenValue() {
        return __classPrivateFieldGet(this, _Rule_forbiddenValue, "f");
    }
    getDescription() {
        return __classPrivateFieldGet(this, _Rule_description, "f");
    }
    isViolated(character) {
        switch (__classPrivateFieldGet(this, _Rule_property, "f")) {
            case "tieneCuernos":
                return character.obtainHaveHorns === __classPrivateFieldGet(this, _Rule_forbiddenValue, "f");
            case "ojosAmarillos":
                return character.obtainYellowEyes === __classPrivateFieldGet(this, _Rule_forbiddenValue, "f");
            case "region":
                return character.obtainPassport.obtainRegion === __classPrivateFieldGet(this, _Rule_forbiddenValue, "f");
            case "sello":
                return character.obtainPassport.obtainStamp === __classPrivateFieldGet(this, _Rule_forbiddenValue, "f");
            case "especieProhibida":
                return character.obtainPassport.obtainDeclaredSpecie === __classPrivateFieldGet(this, _Rule_forbiddenValue, "f");
            default:
                return false;
        }
    }
}
_Rule_day = new WeakMap(), _Rule_property = new WeakMap(), _Rule_forbiddenValue = new WeakMap(), _Rule_description = new WeakMap();
//# sourceMappingURL=Rule.js.map