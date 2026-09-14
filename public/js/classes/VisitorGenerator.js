var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _VisitorGenerator_instances, _VisitorGenerator_parts, _VisitorGenerator_names, _VisitorGenerator_phrases, _VisitorGenerator_stamps, _VisitorGenerator_species, _VisitorGenerator_random, _VisitorGenerator_pickPhrase, _VisitorGenerator_pickAlienFace;
import { Passport } from "./Passport.js";
import { Human } from "./Human.js";
import { Yokai } from "./Yokai.js";
export class VisitorGenerator {
    constructor(randomFn = Math.random) {
        _VisitorGenerator_instances.add(this);
        _VisitorGenerator_parts.set(this, void 0);
        _VisitorGenerator_names.set(this, void 0);
        _VisitorGenerator_phrases.set(this, void 0);
        _VisitorGenerator_stamps.set(this, void 0);
        _VisitorGenerator_species.set(this, void 0);
        _VisitorGenerator_random.set(this, void 0);
        __classPrivateFieldSet(this, _VisitorGenerator_names, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_phrases, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_stamps, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_species, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_random, randomFn, "f");
    }
    setData(parts, names, phrases, stamps, species) {
        __classPrivateFieldSet(this, _VisitorGenerator_parts, parts, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_names, names, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_phrases, phrases, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_stamps, stamps, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_species, species, "f");
    }
    generate(dayNumber, day, hardMode = false) {
        const HARD_MODE_EXTRA_RATIO = 0.15;
        const goal = day.getVisitorGoal();
        let problematicRatio = Math.min(dayNumber + 1, goal - 1) / goal;
        if (hardMode) {
            problematicRatio = Math.min(problematicRatio + HARD_MODE_EXTRA_RATIO, 0.95);
        }
        const isProblematic = __classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) < problematicRatio;
        const name = __classPrivateFieldGet(this, _VisitorGenerator_names, "f")[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_names, "f").length)];
        const phrase = __classPrivateFieldGet(this, _VisitorGenerator_instances, "m", _VisitorGenerator_pickPhrase).call(this);
        let face = __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").rostro[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").rostro.length)];
        const eyesShape = __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").ojos[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").ojos.length)];
        const mouth = __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").boca[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").boca.length)];
        const horns = __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").cuernos[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").cuernos.length)];
        const hair = __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").sombrero[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").sombrero.length)];
        const activeRules = day.getActiveRules();
        function withoutForbiddenToday(fullPool, property) {
            const forbiddenToday = activeRules.filter((rule) => rule.getProperty() === property).map((rule) => rule.getForbiddenValue());
            return fullPool.filter((value) => !forbiddenToday.includes(value));
        }
        const ALIEN_CHANCE = 0.18;
        if (!isProblematic) {
            const allRegions = ["playa", "ciudad", "rio", "bosque", "montana"];
            const allStamps = __classPrivateFieldGet(this, _VisitorGenerator_stamps, "f").map((stamp) => stamp.color);
            const safeRegions = withoutForbiddenToday(allRegions, "region");
            const safeStamps = withoutForbiddenToday(allStamps, "sello");
            const safeSpecies = withoutForbiddenToday(__classPrivateFieldGet(this, _VisitorGenerator_species, "f"), "especieProhibida").filter((specie) => specie !== "alien");
            let region = safeRegions[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * safeRegions.length)];
            const stamp = safeStamps[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * safeStamps.length)];
            let declaredSpecie = safeSpecies[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * safeSpecies.length)];
            if (__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) < ALIEN_CHANCE) {
                face = __classPrivateFieldGet(this, _VisitorGenerator_instances, "m", _VisitorGenerator_pickAlienFace).call(this);
                region = "via lactea";
                declaredSpecie = "alien";
            }
            const passport = new Passport(name, region, declaredSpecie, stamp);
            return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);
        }
        const activeProperties = activeRules
            .map((rule) => rule.getProperty())
            .filter((property, index, properties) => properties.indexOf(property) === index)
            .filter((property) => property !== "selloAlien");
        const targetProperty = activeProperties[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * activeProperties.length)];
        const rulesForProperty = activeRules.filter((rule) => rule.getProperty() === targetProperty);
        const targetRule = rulesForProperty[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * rulesForProperty.length)];
        let yokaiType = "oni";
        let declaredSpecie = "";
        let region = "campo";
        let stamp = "dorado";
        const property = targetRule.getProperty();
        const canBeAlien = property !== "region" && property !== "especieProhibida";
        const isAlien = canBeAlien && __classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) < ALIEN_CHANCE;
        if (isAlien) {
            face = __classPrivateFieldGet(this, _VisitorGenerator_instances, "m", _VisitorGenerator_pickAlienFace).call(this);
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
            const especieProhibidaHoy = activeRules.filter((rule) => rule.getProperty() === "especieProhibida").map((rule) => rule.getForbiddenValue());
            const lieOptions = __classPrivateFieldGet(this, _VisitorGenerator_species, "f").filter((specie) => specie !== yokaiType && !especieProhibidaHoy.includes(specie));
            declaredSpecie = lieOptions[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * lieOptions.length)];
        }
        if (property === "sello") {
            declaredSpecie = "humano";
            stamp = targetRule.getForbiddenValue();
        }
        if (property === "especieProhibida") {
            declaredSpecie = targetRule.getForbiddenValue();
        }
        const EXTRA_TRAIT_CHANCE = 0.35;
        const stampRules = activeRules.filter((rule) => rule.getProperty() === "sello");
        const bannedSpecieRules = activeRules.filter((rule) => rule.getProperty() === "especieProhibida");
        const extraTraitOptions = [];
        const regionRuleActive = activeRules.some((rule) => rule.getProperty() === "region");
        if (property !== "region" && regionRuleActive) {
            extraTraitOptions.push("region");
        }
        if (property !== "sello" && stampRules.length > 0) {
            extraTraitOptions.push("sello");
        }
        if (property !== "especieProhibida" && bannedSpecieRules.length > 0) {
            extraTraitOptions.push("especieProhibida");
        }
        if (extraTraitOptions.length > 0 && __classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) < EXTRA_TRAIT_CHANCE) {
            const extraTrait = extraTraitOptions[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * extraTraitOptions.length)];
            if (extraTrait === "region") {
                region = "rio";
            }
            if (extraTrait === "sello") {
                const extraStampRule = stampRules[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * stampRules.length)];
                stamp = extraStampRule.getForbiddenValue();
            }
            if (extraTrait === "especieProhibida") {
                const extraBannedSpecieRule = bannedSpecieRules[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * bannedSpecieRules.length)];
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
}
_VisitorGenerator_parts = new WeakMap(), _VisitorGenerator_names = new WeakMap(), _VisitorGenerator_phrases = new WeakMap(), _VisitorGenerator_stamps = new WeakMap(), _VisitorGenerator_species = new WeakMap(), _VisitorGenerator_random = new WeakMap(), _VisitorGenerator_instances = new WeakSet(), _VisitorGenerator_pickPhrase = function _VisitorGenerator_pickPhrase() {
    return __classPrivateFieldGet(this, _VisitorGenerator_phrases, "f")[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_phrases, "f").length)];
}, _VisitorGenerator_pickAlienFace = function _VisitorGenerator_pickAlienFace() {
    return __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").alienes[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * __classPrivateFieldGet(this, _VisitorGenerator_parts, "f").alienes.length)];
};
//# sourceMappingURL=VisitorGenerator.js.map