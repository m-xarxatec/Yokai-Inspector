export class Paasport {
    #nombre: string;
    #region: string; 
    #especieDeclarada: string;
    #sello: string;


    constructor(nombre: string, region: string, especieDeclarada: string, sello: string){
        this.#nombre = nombre;
        this.#region = region;
        this.#especieDeclarada = especieDeclarada;
        this.#sello = sello
    }

    get obtenerNombre() {
        return this.#nombre;
    }
    get obtenerRegion() {
        return this.#region;
    }
    get obtenerEspecieDeclarada() {
        return this.#especieDeclarada;
    }
    get obtenerSello() {
        return this.#sello;
    }
}