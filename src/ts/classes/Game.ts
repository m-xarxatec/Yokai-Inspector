import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, getHistory, addCredits } from "../Storage.js";
import { Passport } from "./Passport.js";
import { Character } from "./Character.js";
import { Human } from "./Human.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";


export class Game{

    #dayNumber: number;
    #errors: number;
    #money: number;
    #maxErrors: number;
    #totalDays: number;
    #days: Day[];
    #currentVisitor: Character | null;
    #visitorsSeenToday: number;
    #parts: any;
    #names: string[];
    #phrases: string[]
    #stamps: any[];
    #species: string[];
    #suspiciousPhrases: string[];
    #playerName: string;

    constructor(playerName: string = "Jugador"){
        this.#playerName = playerName.trim() !== "" ? playerName : "Jugador";
        this.#dayNumber = 1;
        this.#errors = 0;
        this.#money = 10;
        this.#maxErrors = 4;
        this.#totalDays = 7;
        this.#days = [];
        this.#currentVisitor = null;
        this.#visitorsSeenToday = 0;
        this.#names = [];
        this.#phrases = [];
        this.#stamps = [];
        this.#species = [];
        this.#suspiciousPhrases = [];
    }

    loadData(onComplete: () => void): void {
        Promise.all([
            fetch("data/partes.json").then(r => r.json()),
            fetch("data/yokais.json").then(r => r.json()),
            fetch("data/nombres.json").then(r => r.json()),
            fetch("data/frases.json").then(r => r.json()),
            fetch("data/reglas.json").then(r => r.json()),
            fetch("data/dias.json").then(r => r.json()),
            fetch("data/sellos.json").then(r => r.json()),
            fetch("data/species.json").then(r => r.json()),
            fetch("data/frases_sospechosas.json").then(r => r.json())]).then(([parts, yokais, names, phrases, rawRules, rawDays, stamps, species, suspiciousPhrases]) =>{
                this.#parts = parts;
                this.#names = names;
                this.#phrases = phrases;
                this.#stamps = stamps;
                this.#species = species;
                this.#suspiciousPhrases = suspiciousPhrases;

                const rules = rawRules.map((r: any) => new Rule(r.dia, r.propiedad, r.valorProhibido, r.descripcion));
                this.#days = rawDays.map((d: any) => {
                    const activeRules = rules.filter((rule: Rule) => d.reglasActivas.includes(rule.getDay()));
                    return new Day(d.dia, d.objetivoVisitantes, activeRules, d.mensajeIntro);});

                onComplete();}).catch(error => {console.log("no se pudieron cargar los datos del juego");
                window.alert("hubo un problema cargando el juego, mira la consola para detectarlo");});
    }

    startNewGame(): void {
        this.#startDay();
    }

    #startDay(): void {
        this.#visitorsSeenToday = 0;
        this.#currentVisitor = this.#generateVisitor();
        saveCurrentGame({ dayNumber: this.#dayNumber, errors: this.#errors, money: this.#money})
    }
    #generateVisitor(): Character {
        // el dia ya no tiene una cantidad fija de visitantes (dura por tiempo, no
        // por conteo) - "goal" queda solo como el denominador de la proporcion de
        // problematicos, calibrada por dia; en vez de repartir una cantidad exacta
        // en un array pre-armado, se sortea de nuevo en cada visitante.
        const goal = this.#days[this.#dayNumber - 1].getVisitorGoal();
        const problematicRatio = Math.min(this.#dayNumber + 1, goal - 1) / goal;
        const isProblematic = Math.random() < problematicRatio;
        const name = this.#names[Math.floor(Math.random() * this.#names.length)];
        const phrase = this.#pickPhrase(isProblematic);
        const face = this.#parts.rostro[Math.floor(Math.random() * this.#parts.rostro.length)];
        const eyesShape = this.#parts.ojos[Math.floor(Math.random() * this.#parts.ojos.length)];
        const mouth = this.#parts.boca[Math.floor(Math.random() * this.#parts.boca.length)];
        const horns = this.#parts.cuernos[Math.floor(Math.random() * this.#parts.cuernos.length)];
        const hair = this.#parts.sombrero[Math.floor(Math.random() * this.#parts.sombrero.length)];

        const activeRules = this.#days[this.#dayNumber - 1].getActiveRules();

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

        if (!isProblematic) {
            const allRegions = ["playa", "ciudad", "rio", "bosque", "montana", "via lactea"];
            const allStamps = this.#stamps.map((stamp: any) => stamp.color);

            const safeRegions = withoutForbiddenToday(allRegions, "region");
            const safeStamps = withoutForbiddenToday(allStamps, "sello");
            const safeSpecies = withoutForbiddenToday(this.#species, "especieProhibida");

            const region = safeRegions[Math.floor(Math.random() * safeRegions.length)];
            const stamp = safeStamps[Math.floor(Math.random() * safeStamps.length)];
            const declaredSpecie = safeSpecies[Math.floor(Math.random() * safeSpecies.length)];
            const passport = new Passport(name, region, declaredSpecie, stamp);
            return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);

        }

        // se elige primero la CATEGORIA (propiedad) y recien despues una regla puntual
        // dentro de ella - si se eligiera directo entre reglas individuales, un dia con
        // varias reglas de la misma propiedad activas a la vez (ver "especieProhibida",
        // 4 entradas el mismo dia, o "sello" con 2 desde el dia 6) pesaria de mas esa
        // categoria frente al resto, sin que problematicRatio lo haya contemplado.
        const activeProperties = activeRules
            .map((rule: Rule) => rule.getProperty())
            .filter((property: string, index: number, properties: string[]) => properties.indexOf(property) === index);
        const targetProperty = activeProperties[Math.floor(Math.random() * activeProperties.length)];
        const rulesForProperty = activeRules.filter((rule: Rule) => rule.getProperty() === targetProperty);
        const targetRule = rulesForProperty[Math.floor(Math.random() * rulesForProperty.length)];

        let yokaiType = "oni";
        let declaredSpecie = "";
        let region = "campo";
        let stamp = "dorado";

        const property = targetRule.getProperty();

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

        const passport = new Passport(name, region, declaredSpecie, stamp);

        if (targetRule.getProperty() === "sello" || targetRule.getProperty() === "especieProhibida") {
        return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);
        }
        return new Yokai(name, passport, face, eyesShape, mouth, horns, hair, phrase, yokaiType);
    }

    // los visitantes problematicos tienen mas chance de decir una frase con pista (no siempre);
    // los honestos tienen una chance chica de decir una tambien, para que la pista no sea 100% confiable.
    #pickPhrase(isProblematic: boolean): string {
        const suspiciousChance = isProblematic ? 0.5 : 0.12;
        if (Math.random() < suspiciousChance) {
            return this.#suspiciousPhrases[Math.floor(Math.random() * this.#suspiciousPhrases.length)];
        }
        return this.#phrases[Math.floor(Math.random() * this.#phrases.length)];
    }

    decide(accept: boolean): void {
    const currentDay = this.#days[this.#dayNumber - 1];
    const violatedRule = currentDay.evaluateCharacter(this.#currentVisitor as Character);
    const shouldReject = violatedRule !== null; //si se esta violando una regla, el personaje actual debe ser rechazado
    const wasCorrect = (accept && !shouldReject) || (!accept && shouldReject);

    if (wasCorrect) {
        this.#money += 2; // antes 10 - se achico porque ahora, con dia por tiempo, se pueden ver muchos mas visitantes que antes
    } else {
        this.#money -= 5;
        this.#errors += 1;
    }

    this.#visitorsSeenToday += 1;

    if (this.isLost()) {
        saveToHistory({ day: this.#dayNumber, errors: this.#errors, money: this.#money, result: "derrota", name: this.#playerName });
        addCredits(this.#playerName, this.#money);
        deleteCurrentGame();
        return;
    }

    this.#currentVisitor = this.#generateVisitor();
    }

    // el dia ya no termina por cantidad de visitantes: lo llama main.ts cuando se
    // acaba el temporizador del dia. Antes vivia adentro de decide(), atado a
    // visitorsSeenToday >= currentDay.getVisitorGoal().
    endDay(): void {
    this.#dayNumber += 1;
    if (this.isWon()) {
        saveToHistory({ day: this.#totalDays, errors: this.#errors, money: this.#money, result: "victoria", name: this.#playerName });
        addCredits(this.#playerName, this.#money);
        deleteCurrentGame();
        return;
    }
    this.#startDay();
    }

    isLost(): boolean {
    return this.#errors >= this.#maxErrors;
    }

    isWon(): boolean {
    return this.#dayNumber > this.#totalDays;
    }

    get dayNumber(): number { 
        return this.#dayNumber; 
    }
    get errors(): number { 
        return this.#errors; 
    }
    get money(): number { 
        return this.#money; 
    }
    get currentVisitor(): Character | null {
         return this.#currentVisitor; 
        }
    get currentDay(): Day {
        return this.#days[Math.min(this.#dayNumber, this.#totalDays) - 1];
    }
    get playerName(): string {
        return this.#playerName;
    }

    loadProgress(): boolean {
    const saved = loadCurrentGame();
    if (saved === null) {
        return false;
    }
    this.#dayNumber = saved.dayNumber;
    this.#errors = saved.errors;
    this.#money = saved.money;
    this.#startDay();
    return true;
    }
}

