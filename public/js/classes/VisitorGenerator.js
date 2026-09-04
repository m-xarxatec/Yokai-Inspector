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
        // fuente de azar: Math.random por defecto (identico a siempre), o un
        // generador con semilla si Game recibio uno (desafio diario, ver
        // src/ts/random.ts). Todo el sorteo de este archivo pasa por this.#random().
        _VisitorGenerator_random.set(this, void 0);
        __classPrivateFieldSet(this, _VisitorGenerator_names, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_phrases, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_stamps, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_species, [], "f");
        __classPrivateFieldSet(this, _VisitorGenerator_random, randomFn, "f");
    }
    // llamado desde Game.loadData() apenas terminan de llegar los 8 fetch,
    // mismo momento en que antes se asignaban estos campos directo en Game
    setData(parts, names, phrases, stamps, species) {
        __classPrivateFieldSet(this, _VisitorGenerator_parts, parts, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_names, names, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_phrases, phrases, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_stamps, stamps, "f");
        __classPrivateFieldSet(this, _VisitorGenerator_species, species, "f");
    }
    // dayNumber y day llegan por parametro en vez de leerse de un campo propio
    // (Game ya los tiene, no hace falta duplicarlos aca) - mismo indexado
    // (this.#days[this.#dayNumber - 1]) que ya usaba Game, sin pasar por el
    // getter currentDay (que clampea contra totalDays) para no cambiar nada
    // hardMode = modo dificil (ver Game): adelanta la curva de problematicos,
    // sube un extra fijo la proporcion de visitantes que hay que rechazar. Es
    // opcional para no romper a quien llame generate(dia, day) a secas (los
    // tests, y todo el codigo anterior al modo dificil).
    generate(dayNumber, day, hardMode = false) {
        // el dia ya no tiene una cantidad fija de visitantes (dura por tiempo, no
        // por conteo) - "goal" queda solo como el denominador de la proporcion de
        // problematicos, calibrada por dia; en vez de repartir una cantidad exacta
        // en un array pre-armado, se sortea de nuevo en cada visitante.
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
        // pool completo menos lo que la regla de esa propiedad prohiba HOY: asi un dato
        // (region, sello, especie) puede aparecer en el pasaporte desde el dia 1 sin
        // ninguna consecuencia, y recien se vuelve invalido el dia en que se activa su
        // regla - un visitante "seguro" nunca puede mostrar, por pura casualidad del
        // sorteo, un valor que hoy SI seria motivo de rechazo (eso rompería
        // problematicRatio, que no lo contempla).
        function withoutForbiddenToday(fullPool, property) {
            const forbiddenToday = activeRules.filter((rule) => rule.getProperty() === property).map((rule) => rule.getForbiddenValue());
            return fullPool.filter((value) => !forbiddenToday.includes(value));
        }
        // cada cuanto sale un alien en vez de un rostro comun. Un alien NO es una
        // especie de Yokai: es un rostro aparte (partes.json -> "alienes") que
        // siempre viaja con el mismo pasaporte, ver #applyAlienPassport().
        const ALIEN_CHANCE = 0.18;
        if (!isProblematic) {
            // "via lactea"/"alien" quedan fuera del sorteo comun a proposito: son los
            // datos propios de los alien y no los puede declarar nadie mas que lo sea
            // de verdad. Si no, un visitante con rostro humano podia salir declarando
            // "alien" y "via lactea" sin serlo, y con la regla del sello azul en juego
            // eso es confuso de leer: el pasaporte dice alien pero corresponde el sello
            // verde. (Un Yokai mintiendo SI puede declararse "alien" - ver lieOptions
            // mas abajo - pero ese siempre viola alguna regla, asi que igual se rechaza.)
            const allRegions = ["playa", "ciudad", "rio", "bosque", "montana"];
            const allStamps = __classPrivateFieldGet(this, _VisitorGenerator_stamps, "f").map((stamp) => stamp.color);
            const safeRegions = withoutForbiddenToday(allRegions, "region");
            const safeStamps = withoutForbiddenToday(allStamps, "sello");
            const safeSpecies = withoutForbiddenToday(__classPrivateFieldGet(this, _VisitorGenerator_species, "f"), "especieProhibida").filter((specie) => specie !== "alien");
            let region = safeRegions[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * safeRegions.length)];
            const stamp = safeStamps[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * safeStamps.length)];
            let declaredSpecie = safeSpecies[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * safeSpecies.length)];
            // un alien "en regla": ni "via lactea" ni "alien" estan prohibidos por
            // ninguna regla, asi que sigue siendo un visitante seguro - lo unico
            // distinto es que desde el dia 6 hay que aprobarlo con el sello azul
            // (eso no lo decide el pasaporte, lo decide el jugador, ver decide())
            if (__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) < ALIEN_CHANCE) {
                face = __classPrivateFieldGet(this, _VisitorGenerator_instances, "m", _VisitorGenerator_pickAlienFace).call(this);
                region = "via lactea";
                declaredSpecie = "alien";
            }
            const passport = new Passport(name, region, declaredSpecie, stamp);
            return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);
        }
        // se elige primero la CATEGORIA (propiedad) y recien despues una regla puntual
        // dentro de ella - si se eligiera directo entre reglas individuales, un dia con
        // varias reglas de la misma propiedad activas a la vez (ver "especieProhibida",
        // 4 entradas el mismo dia, o "sello" con 2 desde el dia 6) pesaria de mas esa
        // categoria frente al resto, sin que problematicRatio lo haya contemplado.
        // "selloAlien" queda afuera a proposito: no es una regla de rechazo (ver
        // Rule.isViolated()), asi que no sirve para fabricar un visitante problematico -
        // si se la eligiera como categoria, el visitante saldria sin ningun rasgo que
        // violar y contaria como problematico igual, corriendo problematicRatio.
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
        // el rostro de alien solo se puede usar cuando el rasgo que vuelve problematico
        // al visitante NO vive en el pasaporte: con "region" haria falta declarar "rio"
        // y con "especieProhibida" una palabra de la lista negra, y el pasaporte fijo
        // del alien ("via lactea"/"alien") pisaria justo ese rasgo, dejandolo limpio.
        // Con cuernos, ojos amarillos o sello prohibido no hay conflicto: el rasgo
        // sobrevive igual al pasaporte forzado.
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
        // un Yokai generado por su rasgo fisico (tieneCuernos/ojosAmarillos/region) jamas
        // reconoce su propia especie en el pasaporte - SIEMPRE miente sobre eso, no "a veces
        // por estadistica" (si se sorteara con probabilidad iria a coincidir alguna vez).
        // Antes del dia 4 esto no tiene consecuencia (la especie declarada todavia no se
        // revisa), pero el personaje ya miente igual - es asi de nacimiento, no algo que
        // empiece a hacer recien cuando hay una regla. Ademas, tambien evita por sorteo
        // cualquier otra palabra que YA este en la lista negra hoy - si no, cualquiera de
        // estos Yokai violaria SIEMPRE (no solo con la chance del combo de mas abajo) su
        // regla fisica Y especieProhibida a la vez, volviendo a esta ultima redundante con
        // las de los dias 1-3. El combo de mas abajo sigue siendo la UNICA via intencional
        // para que le toque una palabra prohibida ademas de su rasgo fisico.
        if (property === "tieneCuernos" || property === "ojosAmarillos" || property === "region") {
            const especieProhibidaHoy = activeRules.filter((rule) => rule.getProperty() === "especieProhibida").map((rule) => rule.getForbiddenValue());
            const lieOptions = __classPrivateFieldGet(this, _VisitorGenerator_species, "f").filter((specie) => specie !== yokaiType && !especieProhibidaHoy.includes(specie));
            declaredSpecie = lieOptions[Math.floor(__classPrivateFieldGet(this, _VisitorGenerator_random, "f").call(this) * lieOptions.length)];
        }
        if (property === "sello") {
            declaredSpecie = "humano";
            stamp = targetRule.getForbiddenValue();
        }
        // lista negra de especies (dia 4): no depende de ningun rasgo fisico, asi que
        // no hace falta generar un Yokai - alcanza con que el pasaporte declare una de
        // las especies prohibidas (ver mas abajo, se devuelve un Human igual que "sello")
        if (property === "especieProhibida") {
            declaredSpecie = targetRule.getForbiddenValue();
        }
        // rasgos combinados: ademas del rasgo principal de arriba (el de targetRule), un visitante
        // problematico puede tener, con una probabilidad extra, UN segundo rasgo sospechoso (nunca
        // dos a la vez, para no dejar 3 señales juntas y sacar toda la duda) de otra regla que YA
        // este activa hoy - obliga a revisar todo el pasaporte, no solo "el rasgo del dia".
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
        // va DESPUES de los rasgos combinados a proposito: el pasaporte del alien es
        // fijo y pisa lo que hubiera sorteado el rasgo extra (region/especie). El rasgo
        // PRINCIPAL nunca se pierde - los tres que pueden tocarle a un alien viven
        // fuera del pasaporte (cuernos, ojos amarillos) o en el sello, que no se toca.
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