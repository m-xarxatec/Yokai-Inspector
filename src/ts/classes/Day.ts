import { Character } from "./Character.js";
import { Rule } from "./Rule.js";

export class Day {
  #number: number;
  #visitorGoal: number;
  #activeRules: Rule[];
  #introMessage: string;

  constructor(number: number, visitorGoal: number, activeRules: Rule[], introMessage: string) {
    this.#number = number;
    this.#visitorGoal = visitorGoal;
    this.#activeRules = activeRules;
    this.#introMessage = introMessage;
  }

  getNumber(): number {
    return this.#number;
  }

  getVisitorGoal(): number {
    return this.#visitorGoal;
  }

  getActiveRules(): Rule[] {
    return this.#activeRules;
  }

  getIntroMessage(): string {
    return this.#introMessage;
  }

  evaluateCharacter(character: Character): Rule | null {
    const violatedRule = this.#activeRules.find((rule: Rule) => rule.isViolated(character));
    if (violatedRule === undefined) {
      return null;
    }
    return violatedRule;
  }
}
