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
var _Yokai_yokaiType;
import { Character } from "./Character.js";
export class Yokai extends Character {
    constructor(name, passport, face, eyes, mouth, horns, hair, phrase, yokaiType) {
        let yellowEyes = false;
        let haveHorns = false;
        if (yokaiType === "oni")
            haveHorns = true;
        if (yokaiType === "kitsune")
            yellowEyes = true;
        super(name, passport, face, eyes, yellowEyes, mouth, horns, haveHorns, hair, phrase);
        _Yokai_yokaiType.set(this, void 0);
        __classPrivateFieldSet(this, _Yokai_yokaiType, yokaiType, "f");
    }
    // tipo REAL del Yokai ("oni"/"kitsune"/"kappa"), no el que declara el pasaporte -
    // lo usa Game para los premios de fin de partida ("no se te paso ni un solo kappa")
    get obtainYokaiType() {
        return __classPrivateFieldGet(this, _Yokai_yokaiType, "f");
    }
}
_Yokai_yokaiType = new WeakMap();
//# sourceMappingURL=Yokai.js.map