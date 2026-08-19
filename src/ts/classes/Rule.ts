import { Character } from "./Character.js";

export class Rule {
  #day: number;
  #property: string;
  #forbiddenValue: any;
  #description: string;

  constructor(day: number, property: string, forbiddenValue: any, description: string) {
    this.#day = day;
    this.#property = property;
    this.#forbiddenValue = forbiddenValue;
    this.#description = description;
  }

  getDay(): number {
    return this.#day;
  }

  getProperty(): string {
    return this.#property;
  }

  getForbiddenValue(): any {
    return this.#forbiddenValue;
  }

  getDescription(): string {
    return this.#description;
  }

  isViolated(character: Character): boolean {
    switch (this.#property) {
      case "tieneCuernos":
        return character.obtainHaveHorns === this.#forbiddenValue;
      case "ojosAmarillos":
        return character.obtainYellowEyes === this.#forbiddenValue;
      case "region":
        return character.obtainPassport.obtainRegion === this.#forbiddenValue;
      case "sello":
        return character.obtainPassport.obtainStamp === this.#forbiddenValue;
      case "especieProhibida":
        return character.obtainPassport.obtainDeclaredSpecie === this.#forbiddenValue;
      case "selloAlien":
        // OJO: esta regla NUNCA se viola, y esta bien que asi sea. Las demas dicen
        // A QUIEN hay que rechazar; esta dice COMO hay que aprobar (a los alien se
        // los deja pasar con el sello azul en vez del verde, ver Game.decide()).
        // Vive igual en reglas.json/dias.json para activarse el dia que corresponde
        // y para que su descripcion salga en la lista de reglas activas del dia.
        return false;
      default:
        return false;
    }
  }
}
