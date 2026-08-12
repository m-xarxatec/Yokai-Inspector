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
        return character.tieneCuernosVisibles() === this.#forbiddenValue;
      case "ojosAmarillos":
        return character.tieneOjosAmarillos() === this.#forbiddenValue;
      case "region":
        return character.obtenerPasaporte().obtenerRegion() === this.#forbiddenValue;
      case "sello":
        return character.obtenerPasaporte().obtenerSello() === this.#forbiddenValue;
      case "mintioSobreEspecie":
        return character.mintioSobreEspecie() === this.#forbiddenValue;
      default:
        return false;
    }
  }
}
