var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Yokai_yokaiType;
import { Character } from "./Character.js";
export class Yokai extends Character {
    constructor(name, passport, face, eyes, nose, ear, horns, hair, phrase, yokaiType) {
        let yellowEyes = false;
        let haveHorns = false;
        if (yokaiType === "oni")
            haveHorns = true;
        if (yokaiType === "kitsune")
            yellowEyes = true;
        super(name, passport, face, eyes, yellowEyes, nose, ear, horns, haveHorns, hair, phrase);
        _Yokai_yokaiType.set(this, void 0);
        __classPrivateFieldSet(this, _Yokai_yokaiType, yokaiType, "f");
    }
    specieLiar() {
        let yokaiLiar = false;
        if (this.obtainPassport.obtainDeclaredSpecie === "humano" && (this.obtainPassport.obtainRegion === "rio" || this.obtainHaveHorns || this.obtainYellowEyes))
            yokaiLiar = true;
        return yokaiLiar;
    }
}
_Yokai_yokaiType = new WeakMap();
//# sourceMappingURL=Yokai.js.map