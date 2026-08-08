import { Character } from "./Character.ts";
import { Passport } from "./Passport.ts";

export class Yokai extends Character{

    #yokaiType: string;

    constructor(name: string, passport: Passport, face: string, eyes: string, nose: string,
        ear: string, horns: string, hair: string, phrase: string, yokaiType: string){
            let yellowEyes = false;
            let haveHorns = false;

            if (yokaiType === "oni")haveHorns = true;
            if (yokaiType === "kitsune") yellowEyes = true;
 //           if (yokaiType === "kappa");  logica por solucionar

            super(name, passport, face, eyes, yellowEyes, nose, ear, horns, haveHorns, hair, phrase);

            this.#yokaiType = yokaiType;
        }
}