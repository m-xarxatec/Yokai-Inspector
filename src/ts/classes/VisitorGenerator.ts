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

    constructor() {
        this.#names = [];
        this.#phrases = [];
        this.#stamps = [];
        this.#species = [];
    }

    // llamado desde Game.loadData() apenas terminan de llegar los 8 fetch,
    // mismo momento en que antes se asignaban estos campos directo en Game
    setData(parts: any, names: string[], phrases: string[], stamps: any[], species: string[]): void {
        this.#parts = parts;
        this.#names = names;
        this.#phrases = phrases;
        this.#stamps = stamps;
        this.#species = species;
    }

    // dayNumber y day llegan por parametro en vez de leerse de un campo propio
    // (Game ya los tiene, no hace falta duplicarlos aca) - mismo indexado
    // (this.#days[this.#dayNumber - 1]) que ya usaba Game, sin pasar por el
    // getter currentDay (que clampea contra totalDays) para no cambiar nada
    generate(dayNumber: number, day: Day): Character {
        // el dia ya no tiene una cantidad fija de visitantes (dura por tiempo, no
        // por conteo) - "goal" queda solo como el denominador de la proporcion de
        // problematicos, calibrada por dia; en vez de repartir una cantidad exacta
        // en un array pre-armado, se sortea de nuevo en cada visitante.
        const goal = day.getVisitorGoal();
        const problematicRatio = Math.min(dayNumber + 1, goal - 1) / goal;
        const isProblematic = Math.random() < problematicRatio;
        const name = this.#names[Math.floor(Math.random() * this.#names.length)];
        const phrase = this.#pickPhrase();
        let face = this.#parts.rostro[Math.floor(Math.random() * this.#parts.rostro.length)];
        const eyesShape = this.#parts.ojos[Math.floor(Math.random() * this.#parts.ojos.length)];
        const mouth = this.#parts.boca[Math.floor(Math.random() * this.#parts.boca.length)];
        const horns = this.#parts.cuernos[Math.floor(Math.random() * this.#parts.cuernos.length)];
        const hair = this.#parts.sombrero[Math.floor(Math.random() * this.#parts.sombrero.length)];

        const activeRules = day.getActiveRules();

        // pool completo menos lo que la regla de esa propiedad prohiba HOY: asi un dato
        // (region, sello, especie) puede aparecer en el pasaporte desde el dia 1 sin
        // ninguna consecuencia, y recien se vuelve invalido el dia en que se activa su
        // regla - un visitante "seguro" nunca puede mostrar, por pura casualidad del
        // sorteo, un valor que hoy SI seria motivo de rechazo (eso rompería
        // problematicRatio, que no lo contempla).
        function withoutForbiddenToday(fullPool: string[], property: string): string[] {
            const forbiddenToday = activeRules.filter((rule: Rule) => rule.getProperty() === property).map((rule: Rule) => rule.getForbiddenValue());
            return fullPool.filter((value: string) => !forbiddenToday.includes(value));
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
            const allStamps = this.#stamps.map((stamp: any) => stamp.color);

            const safeRegions = withoutForbiddenToday(allRegions, "region");
            const safeStamps = withoutForbiddenToday(allStamps, "sello");
            const safeSpecies = withoutForbiddenToday(this.#species, "especieProhibida").filter((specie: string) => specie !== "alien");

            let region = safeRegions[Math.floor(Math.random() * safeRegions.length)];
            const stamp = safeStamps[Math.floor(Math.random() * safeStamps.length)];
            let declaredSpecie = safeSpecies[Math.floor(Math.random() * safeSpecies.length)];

            // un alien "en regla": ni "via lactea" ni "alien" estan prohibidos por
            // ninguna regla, asi que sigue siendo un visitante seguro - lo unico
            // distinto es que desde el dia 6 hay que aprobarlo con el sello azul
            // (eso no lo decide el pasaporte, lo decide el jugador, ver decide())
            if (Math.random() < ALIEN_CHANCE) {
                face = this.#pickAlienFace();
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
            .map((rule: Rule) => rule.getProperty())
            .filter((property: string, index: number, properties: string[]) => properties.indexOf(property) === index)
            .filter((property: string) => property !== "selloAlien");
        const targetProperty = activeProperties[Math.floor(Math.random() * activeProperties.length)];
        const rulesForProperty = activeRules.filter((rule: Rule) => rule.getProperty() === targetProperty);
        const targetRule = rulesForProperty[Math.floor(Math.random() * rulesForProperty.length)];

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
        const isAlien = canBeAlien && Math.random() < ALIEN_CHANCE;
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
        const especieProhibidaHoy = activeRules.filter((rule: Rule) => rule.getProperty() === "especieProhibida").map((rule: Rule) => rule.getForbiddenValue());
        const lieOptions = this.#species.filter((specie: string) => specie !== yokaiType && !especieProhibidaHoy.includes(specie));
        declaredSpecie = lieOptions[Math.floor(Math.random() * lieOptions.length)];
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

        if (extraTraitOptions.length > 0 && Math.random() < EXTRA_TRAIT_CHANCE) {
        const extraTrait = extraTraitOptions[Math.floor(Math.random() * extraTraitOptions.length)];
        if (extraTrait === "region") {
        region = "rio";
        }
        if (extraTrait === "sello") {
        const extraStampRule = stampRules[Math.floor(Math.random() * stampRules.length)];
        stamp = extraStampRule.getForbiddenValue();
        }
        if (extraTrait === "especieProhibida") {
        const extraBannedSpecieRule = bannedSpecieRules[Math.floor(Math.random() * bannedSpecieRules.length)];
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

    #pickPhrase(): string {
        return this.#phrases[Math.floor(Math.random() * this.#phrases.length)];
    }

    #pickAlienFace(): string {
        return this.#parts.alienes[Math.floor(Math.random() * this.#parts.alienes.length)];
    }
}
