import { Passport } from "./Passport.js";

export abstract class Character{
    
    #name: string;
    #passport: Passport;
    #face: string;
    #eyes: string;
    #yellowEyes: boolean;
    #mouth: string;
    #horns: string;
    #haveHorns: boolean;
    #hair: string;
    #phrase: string;

    constructor(name: string, passport: Passport, face: string, eyes: string, yellowEyes: boolean, mouth: string,
         horns: string, haveHorns: boolean, hair: string, phrase: string){
            this.#name = name;
            this.#passport = passport;
            this.#face = face;
            this.#eyes = eyes;
            this.#yellowEyes = yellowEyes;
            this.#mouth = mouth;
            this.#horns = horns;
            this.#haveHorns = haveHorns;
            this.#hair = hair;
            this.#phrase = phrase;
         }

    get obtainName() {
        return this.#name;
    }
    
    get obtainPassport(): Passport{
        return this.#passport;
    }
    get obtainFace() {
        return this.#face;
    }
    get obtainEyes() {
        return this.#eyes;
    }
    get obtainYellowEyes(): boolean{
        return this.#yellowEyes;
    }
    get obtainMouth() {
        return this.#mouth;
    }
    get obtainHorns() {
        return this.#horns;
    }
    get obtainHaveHorns(): boolean{
        return this.#haveHorns;
    }
    get obtainHair() {
        return this.#hair;
    }
    get obtainPhrase() {
        return this.#phrase;
    }

    dialogueLine(): string{
        return this.#phrase;
    }

}