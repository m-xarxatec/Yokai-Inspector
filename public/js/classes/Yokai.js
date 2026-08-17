var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
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
    specieLiar() {
        // la especie "aparente" es la que se deduce mirando al personaje, no lo que dice el pasaporte.
        // orden importa: un Yokai puede tener region "rio" ademas de su rasgo principal (ver
        // Game#generateVisitor, rasgos combinados) - por eso la region se chequea primero y el
        // rasgo que define su tipo real (cuernos/ojos amarillos) se chequea al final, para que gane.
        let apparentSpecie = "humano";
        if (this.obtainPassport.obtainRegion === "rio")
            apparentSpecie = "kappa";
        if (this.obtainHaveHorns)
            apparentSpecie = "oni";
        if (this.obtainYellowEyes)
            apparentSpecie = "kitsune";
        return this.obtainPassport.obtainDeclaredSpecie !== apparentSpecie;
    }
}
_Yokai_yokaiType = new WeakMap();
//# sourceMappingURL=Yokai.js.map