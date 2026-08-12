export class Passport {
    #name: string;
    #region: string;
    #declaredSpecie: string;
    #stamp: string;


    constructor(name: string, region: string, declaredSpecie: string, stamp: string){
        this.#name = name;
        this.#region = region;
        this.#declaredSpecie = declaredSpecie;
        this.#stamp = stamp;
    }

    get obtainName() {
        return this.#name;
    }
    get obtainRegion() {
        return this.#region;
    }
    get obtainDeclaredSpecie() {
        return this.#declaredSpecie;
    }
    get obtainStamp() {
        return this.#stamp;
    }
}
