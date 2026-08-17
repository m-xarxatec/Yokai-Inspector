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
}