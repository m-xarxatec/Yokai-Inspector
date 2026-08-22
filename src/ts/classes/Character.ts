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

    // los rostros de alien se llaman "alien1".."alienN" en partes.json (y asi se
    // llaman los archivos en public/img/baseCharacters/) - ese es el unico rasgo
    // REAL que los identifica, igual que obtainHaveHorns identifica a un Oni. La
    // especie declarada del pasaporte NO sirve para esto: "alien" tambien esta en
    // species.json, asi que cualquier Yokai puede declararla al mentir sin ser un
    // alien de verdad.
    isAlien(): boolean{
        return this.#face.startsWith("alien");
    }

}