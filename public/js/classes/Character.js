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
var _Character_name, _Character_passport, _Character_face, _Character_eyes, _Character_yellowEyes, _Character_nose, _Character_ear, _Character_horns, _Character_haveHorns, _Character_hair, _Character_phrase;
export class Character {
    constructor(name, passport, face, eyes, yellowEyes, nose, ear, horns, haveHorns, hair, phrase) {
        _Character_name.set(this, void 0);
        _Character_passport.set(this, void 0);
        _Character_face.set(this, void 0);
        _Character_eyes.set(this, void 0);
        _Character_yellowEyes.set(this, void 0);
        _Character_nose.set(this, void 0);
        _Character_ear.set(this, void 0);
        _Character_horns.set(this, void 0);
        _Character_haveHorns.set(this, void 0);
        _Character_hair.set(this, void 0);
        _Character_phrase.set(this, void 0);
        __classPrivateFieldSet(this, _Character_name, name, "f");
        __classPrivateFieldSet(this, _Character_passport, passport, "f");
        __classPrivateFieldSet(this, _Character_face, face, "f");
        __classPrivateFieldSet(this, _Character_eyes, eyes, "f");
        __classPrivateFieldSet(this, _Character_yellowEyes, yellowEyes, "f");
        __classPrivateFieldSet(this, _Character_nose, nose, "f");
        __classPrivateFieldSet(this, _Character_ear, ear, "f");
        __classPrivateFieldSet(this, _Character_horns, horns, "f");
        __classPrivateFieldSet(this, _Character_haveHorns, haveHorns, "f");
        __classPrivateFieldSet(this, _Character_hair, hair, "f");
        __classPrivateFieldSet(this, _Character_phrase, phrase, "f");
    }
    get obtainName() {
        return __classPrivateFieldGet(this, _Character_name, "f");
    }
    get obtainPassport() {
        return __classPrivateFieldGet(this, _Character_passport, "f");
    }
    get obtainFace() {
        return __classPrivateFieldGet(this, _Character_face, "f");
    }
    get obtainEyes() {
        return __classPrivateFieldGet(this, _Character_eyes, "f");
    }
    get obtainYellowEyes() {
        return __classPrivateFieldGet(this, _Character_yellowEyes, "f");
    }
    get obtainNose() {
        return __classPrivateFieldGet(this, _Character_nose, "f");
    }
    get obtainEar() {
        return __classPrivateFieldGet(this, _Character_ear, "f");
    }
    get obtainHorns() {
        return __classPrivateFieldGet(this, _Character_horns, "f");
    }
    get obtainHaveHorns() {
        return __classPrivateFieldGet(this, _Character_haveHorns, "f");
    }
    get obtainHair() {
        return __classPrivateFieldGet(this, _Character_hair, "f");
    }
    get obtainPhrase() {
        return __classPrivateFieldGet(this, _Character_phrase, "f");
    }
    dialogueLine() {
        return __classPrivateFieldGet(this, _Character_phrase, "f");
    }
    specieLiar() {
        return false;
    }
}
_Character_name = new WeakMap(), _Character_passport = new WeakMap(), _Character_face = new WeakMap(), _Character_eyes = new WeakMap(), _Character_yellowEyes = new WeakMap(), _Character_nose = new WeakMap(), _Character_ear = new WeakMap(), _Character_horns = new WeakMap(), _Character_haveHorns = new WeakMap(), _Character_hair = new WeakMap(), _Character_phrase = new WeakMap();
//# sourceMappingURL=Character.js.map