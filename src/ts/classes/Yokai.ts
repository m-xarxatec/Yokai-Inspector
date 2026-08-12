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
        // la especie "aparente" es la que se deduce mirando al personaje, no lo que dice el pasaporte
        let especieAparente = "humano";
        if (this.obtainHaveHorns) especieAparente = "oni";
        if (this.obtainYellowEyes) especieAparente = "kitsune";
        if (this.obtainPassport.obtainRegion === "rio") especieAparente = "kappa";

        return this.obtainPassport.obtainDeclaredSpecie !== especieAparente;
    }
}