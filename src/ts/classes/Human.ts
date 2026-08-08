import { Character } from "./Character.ts";
import { Passport } from "./Passport.ts";

export class Human extends Character{

    constructor(name: string, passport: Passport, face: string, eyes: string, yellowEyes: boolean, nose: string,
        ear: string, horns: string, haveHorns: boolean, hair: string, phrase: string){
            super(name, passport, face, eyes, yellowEyes, nose, ear, horns, haveHorns, hair,phrase);
        }
}