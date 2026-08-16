import { Character } from "./Character.js";
import { Passport } from "./Passport.js";

export class Yokai extends Character{

    #yokaiType: string;

    constructor(name: string, passport: Passport, face: string, eyes: string, mouth: string,
        horns: string, hair: string, phrase: string, yokaiType: string){
            let yellowEyes = false;
            let haveHorns = false;

            if (yokaiType === "oni")haveHorns = true;
            if (yokaiType === "kitsune") yellowEyes = true;

            super(name, passport, face, eyes, yellowEyes, mouth, horns, haveHorns, hair, phrase);

            this.#yokaiType = yokaiType;
        }

    
    specieLiar(): boolean {
        // la especie "aparente" es la que se deduce mirando al personaje, no lo que dice el pasaporte.
        // orden importa: un Yokai puede tener region "rio" ademas de su rasgo principal (ver
        // Game#generateVisitor, rasgos combinados) - por eso la region se chequea primero y el
        // rasgo que define su tipo real (cuernos/ojos amarillos) se chequea al final, para que gane.
        let apparentSpecie = "humano";
        if (this.obtainPassport.obtainRegion === "rio") apparentSpecie = "kappa";
        if (this.obtainHaveHorns) apparentSpecie = "oni";
        if (this.obtainYellowEyes) apparentSpecie = "kitsune";

        return this.obtainPassport.obtainDeclaredSpecie !== apparentSpecie;
    }
}