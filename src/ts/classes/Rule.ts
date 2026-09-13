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
        return false;
      default:
        return false;
    }
  }
}
