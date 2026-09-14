import { Passport } from "./Passport.js";
import { Character } from "./Character.js";
import { Human } from "./Human.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";

export class VisitorGenerator {
    #parts: any;
    #names: string[];
    #phrases: string[];
    #stamps: any[];
    #species: string[];
    #random: () => number;

    constructor(randomFn: () => number = Math.random) {
        this.#names = [];
        this.#phrases = [];
        this.#stamps = [];
        this.#species = [];
        this.#random = randomFn;
    }

    setData(parts: any, names: string[], phrases: string[], stamps: any[], species: string[]): void {
        this.#parts = parts;
        this.#names = names;
        this.#phrases = phrases;
        this.#stamps = stamps;
        this.#species = species;
    }

    generate(dayNumber: number, day: Day, hardMode: boolean = false): Character {
        const HARD_MODE_EXTRA_RATIO = 0.15;
        const goal = day.getVisitorGoal();
        let problematicRatio = Math.min(dayNumber + 1, goal - 1) / goal;
        if (hardMode) {
            problematicRatio = Math.min(problematicRatio + HARD_MODE_EXTRA_RATIO, 0.95);
        }
        const isProblematic = this.#random() < problematicRatio;
        const name = this.#names[Math.floor(this.#random() * this.#names.length)];
        const phrase = this.#pickPhrase();
        let face = this.#parts.rostro[Math.floor(this.#random() * this.#parts.rostro.length)];
        const eyesShape = this.#parts.ojos[Math.floor(this.#random() * this.#parts.ojos.length)];
        const mouth = this.#parts.boca[Math.floor(this.#random() * this.#parts.boca.length)];
        const horns = this.#parts.cuernos[Math.floor(this.#random() * this.#parts.cuernos.length)];
        const hair = this.#parts.sombrero[Math.floor(this.#random() * this.#parts.sombrero.length)];

        const activeRules = day.getActiveRules();

        function withoutForbiddenToday(fullPool: string[], property: string): string[] {
            const forbiddenToday = activeRules.filter((rule: Rule) => rule.getProperty() === property).map((rule: Rule) => rule.getForbiddenValue());
            return fullPool.filter((value: string) => !forbiddenToday.includes(value));
        }

        const ALIEN_CHANCE = 0.18;

        if (!isProblematic) {
            const allRegions = ["playa", "ciudad", "rio", "bosque", "montana"];
            const allStamps = this.#stamps.map((stamp: any) => stamp.color);

            const safeRegions = withoutForbiddenToday(allRegions, "region");
            const safeStamps = withoutForbiddenToday(allStamps, "sello");
            const safeSpecies = withoutForbiddenToday(this.#species, "especieProhibida").filter((specie: string) => specie !== "alien");

            let region = safeRegions[Math.floor(this.#random() * safeRegions.length)];
            const stamp = safeStamps[Math.floor(this.#random() * safeStamps.length)];
            let declaredSpecie = safeSpecies[Math.floor(this.#random() * safeSpecies.length)];

            if (this.#random() < ALIEN_CHANCE) {
                face = this.#pickAlienFace();
                region = "via lactea";
                declaredSpecie = "alien";
            }

            const passport = new Passport(name, region, declaredSpecie, stamp);
            return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);

        }

        const activeProperties = activeRules
            .map((rule: Rule) => rule.getProperty())
            .filter((property: string, index: number, properties: string[]) => properties.indexOf(property) === index)
            .filter((property: string) => property !== "selloAlien");
        const targetProperty = activeProperties[Math.floor(this.#random() * activeProperties.length)];
        const rulesForProperty = activeRules.filter((rule: Rule) => rule.getProperty() === targetProperty);
        const targetRule = rulesForProperty[Math.floor(this.#random() * rulesForProperty.length)];

        let yokaiType = "oni";
        let declaredSpecie = "";
        let region = "campo";
        let stamp = "dorado";

        const property = targetRule.getProperty();

        const canBeAlien = property !== "region" && property !== "especieProhibida";
        const isAlien = canBeAlien && this.#random() < ALIEN_CHANCE;
        if (isAlien) {
            face = this.#pickAlienFace();
        }

        if (property === "tieneCuernos") {
        yokaiType = "oni";
        }

        if (property === "ojosAmarillos") {
        yokaiType = "kitsune";
        }

        if (property === "region") {
        yokaiType = "kappa";
        region = "rio";
        }

        if (property === "tieneCuernos" || property === "ojosAmarillos" || property === "region") {
        const especieProhibidaHoy = activeRules.filter((rule: Rule) => rule.getProperty() === "especieProhibida").map((rule: Rule) => rule.getForbiddenValue());
        const lieOptions = this.#species.filter((specie: string) => specie !== yokaiType && !especieProhibidaHoy.includes(specie));
        declaredSpecie = lieOptions[Math.floor(this.#random() * lieOptions.length)];
        }

        if (property === "sello") {
        declaredSpecie = "humano";
        stamp = targetRule.getForbiddenValue();
        }

        if (property === "especieProhibida") {
        declaredSpecie = targetRule.getForbiddenValue();
        }

        const EXTRA_TRAIT_CHANCE = 0.35;

        const stampRules = activeRules.filter((rule: Rule) => rule.getProperty() === "sello");
        const bannedSpecieRules = activeRules.filter((rule: Rule) => rule.getProperty() === "especieProhibida");

        const extraTraitOptions: string[] = [];
        const regionRuleActive = activeRules.some((rule: Rule) => rule.getProperty() === "region");
        if (property !== "region" && regionRuleActive) {
        extraTraitOptions.push("region");
        }
        if (property !== "sello" && stampRules.length > 0) {
        extraTraitOptions.push("sello");
        }
        if (property !== "especieProhibida" && bannedSpecieRules.length > 0) {
        extraTraitOptions.push("especieProhibida");
        }

        if (extraTraitOptions.length > 0 && this.#random() < EXTRA_TRAIT_CHANCE) {
        const extraTrait = extraTraitOptions[Math.floor(this.#random() * extraTraitOptions.length)];
        if (extraTrait === "region") {
        region = "rio";
        }
        if (extraTrait === "sello") {
        const extraStampRule = stampRules[Math.floor(this.#random() * stampRules.length)];
        stamp = extraStampRule.getForbiddenValue();
        }
        if (extraTrait === "especieProhibida") {
        const extraBannedSpecieRule = bannedSpecieRules[Math.floor(this.#random() * bannedSpecieRules.length)];
        declaredSpecie = extraBannedSpecieRule.getForbiddenValue();
        }
        }

        if (isAlien) {
            region = "via lactea";
            declaredSpecie = "alien";
        }

        const passport = new Passport(name, region, declaredSpecie, stamp);

        if (targetRule.getProperty() === "sello" || targetRule.getProperty() === "especieProhibida") {
        return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);
        }
        return new Yokai(name, passport, face, eyesShape, mouth, horns, hair, phrase, yokaiType);
    }

    #pickPhrase(): string {
        return this.#phrases[Math.floor(this.#random() * this.#phrases.length)];
    }

    #pickAlienFace(): string {
        return this.#parts.alienes[Math.floor(this.#random() * this.#parts.alienes.length)];
    }
}
