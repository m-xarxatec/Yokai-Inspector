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
var _Passport_name, _Passport_region, _Passport_declaredSpecie, _Passport_stamp;
export class Passport {
    constructor(name, region, declaredSpecie, stamp) {
        _Passport_name.set(this, void 0);
        _Passport_region.set(this, void 0);
        _Passport_declaredSpecie.set(this, void 0);
        _Passport_stamp.set(this, void 0);
        __classPrivateFieldSet(this, _Passport_name, name, "f");
        __classPrivateFieldSet(this, _Passport_region, region, "f");
        __classPrivateFieldSet(this, _Passport_declaredSpecie, declaredSpecie, "f");
        __classPrivateFieldSet(this, _Passport_stamp, stamp, "f");
    }
    get obtainName() {
        return __classPrivateFieldGet(this, _Passport_name, "f");
    }
    get obtainRegion() {
        return __classPrivateFieldGet(this, _Passport_region, "f");
    }
    get obtainDeclaredSpecie() {
        return __classPrivateFieldGet(this, _Passport_declaredSpecie, "f");
    }
    get obtainStamp() {
        return __classPrivateFieldGet(this, _Passport_stamp, "f");
    }
}
_Passport_name = new WeakMap(), _Passport_region = new WeakMap(), _Passport_declaredSpecie = new WeakMap(), _Passport_stamp = new WeakMap();
//# sourceMappingURL=Passport.js.map