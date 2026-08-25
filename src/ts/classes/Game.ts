import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, getHistory, addCredits, addResultToStreak } from "../Storage.js";
import { Passport } from "./Passport.js";
import { Character } from "./Character.js";
import { Human } from "./Human.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";

// penalizacion por decidir sin revisar el pasaporte (ver decide(), parametro
// wasRushed) - chica a proposito, es un descuido, no un error de reglas
const RUSH_PENALTY = 1;

// costo de la pista de la tienda (ver buyHint()) - la mas barata de las 3
// compras, porque no garantiza nada si el visitante esta limpio
const HINT_COST = 3;

// costo del tiempo extra de la tienda (ver buyExtraTime()) - los segundos que
// suma los pone main.ts (EXTRA_TIME_MS), Game.ts solo controla el dinero y el
// limite de una vez por dia
const EXTRA_TIME_COST = 5;

// costo del indulto de la tienda (ver buyInsurance()) - la mas cara de las 3,
// porque puede directamente salvar la partida absorbiendo el 4to error
const INSURANCE_COST = 8;

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
    #playerName: string;
    // datos que solo se usan para los premios de fin de partida (ver main.ts,
    // AWARD_BEATS): que tipo de visitante dejo pasar el jugador alguna vez, y cual
    // fue su dia con mas visitantes atendidos
    #letThroughOni: boolean;
    #letThroughKitsune: boolean;
    #letThroughKappa: boolean;
    #bestDayVisitors: number;
    #bestDayNumber: number;
    // contadores del dia EN CURSO (se resetean en #startDay(), igual que
    // #visitorsSeenToday) y una "foto" del ultimo dia ya cerrado (necesaria
    // porque endDay() ya llama a #startDay() -que resetea los contadores del
    // dia- antes de que main.ts llegue a leerlos, ver pantalla de resumen)
    #dayAccepted: number;
    #dayRejected: number;
    #dayErrors: number;
    #dayMoney: number;
    // cobro diario (gastos fijos) que costo empezar el dia EN CURSO - se fija una
    // sola vez en endDay() al entrar a un dia nuevo (0 el dia 1, que no cobra) y
    // se congela en #lastDayCharge recien cuando ESE dia termina, igual que
    // #dayMoney/#lastDayMoney
    #dayCharge: number;
    // penalizacion de "decidiste sin revisar" (ver decide(), parametro wasRushed) -
    // NO suma a #errors, es un descuido de procedimiento aparte de si la decision
    // en si fue correcta o no. Mismo patron dia/lastDay que #dayMoney/#dayCharge.
    #dayRushPenalty: number;
    #lastDayAccepted: number;
    #lastDayRejected: number;
    #lastDayErrors: number;
    #lastDayMoney: number;
    #lastDayCharge: number;
    #lastDayRushPenalty: number;
    // tienda: limite de 1 tiempo extra comprado por dia (ver buyExtraTime()) -
    // se resetea en #startDay(), no sobrevive al dia siguiente
    #usedExtraTimeToday: boolean;
    // tienda: indulto activo (ver buyInsurance() y decide()) - absorbe el
    // proximo error para que no cuente para #errors, se consume al usarse y
    // tambien se resetea en #startDay() si no se llego a gastar ese dia
    #hasInsurance: boolean;

    constructor(playerName: string = "Jugador", totalDays: number = 7){
        this.#playerName = playerName.trim() !== "" ? playerName : "Jugador";
        this.#dayNumber = 1;
        this.#errors = 0;
        this.#money = 10;
        this.#maxErrors = 4;
        this.#totalDays = totalDays;
        this.#days = [];
        this.#currentVisitor = null;
        this.#visitorsSeenToday = 0;
        this.#names = [];
        this.#phrases = [];
        this.#stamps = [];
        this.#species = [];
        this.#letThroughOni = false;
        this.#letThroughKitsune = false;
        this.#letThroughKappa = false;
        this.#bestDayVisitors = 0;
        this.#bestDayNumber = 0;
        this.#dayAccepted = 0;
        this.#dayRejected = 0;
        this.#dayErrors = 0;
        this.#dayMoney = 0;
        this.#dayCharge = 0;
        this.#dayRushPenalty = 0;
        this.#lastDayAccepted = 0;
        this.#lastDayRejected = 0;
        this.#lastDayErrors = 0;
        this.#lastDayMoney = 0;
        this.#lastDayCharge = 0;
        this.#lastDayRushPenalty = 0;
        this.#usedExtraTimeToday = false;
        this.#hasInsurance = false;
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
            fetch("data/species.json").then(r => r.json())]).then(([parts, yokais, names, phrases, rawRules, rawDays, stamps, species]) =>{
                this.#parts = parts;
                this.#names = names;
                this.#phrases = phrases;
                this.#stamps = stamps;
                this.#species = species;

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
        this.#dayAccepted = 0;
        this.#dayRejected = 0;
        this.#dayErrors = 0;
        this.#dayMoney = 0;
        this.#dayRushPenalty = 0;
        this.#usedExtraTimeToday = false;
        this.#hasInsurance = false;
        this.#currentVisitor = this.#generateVisitor();
        saveCurrentGame({ dayNumber: this.#dayNumber, errors: this.#errors, money: this.#money, totalDays: this.#totalDays})
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
        const phrase = this.#pickPhrase();
        let face = this.#parts.rostro[Math.floor(Math.random() * this.#parts.rostro.length)];
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

    // gastos fijos de vivir el dia que arranca: escala con la cantidad de reglas
    // activas de ese dia (mas reglas, mas visitantes, mas presion economica).
    // Puede dejar #money en negativo, eso no termina la partida por si solo
    // (la unica condicion de derrota es isLost()).
    #chargeDailyCost(): void {
        const activeRulesCount = this.currentDay.getActiveRules().length;
        const cost = 2 + activeRulesCount;
        this.#dayCharge = cost;
        this.#money -= cost;
    }

    #pickPhrase(): string {
        return this.#phrases[Math.floor(Math.random() * this.#phrases.length)];
    }

    #pickAlienFace(): string {
        return this.#parts.alienes[Math.floor(Math.random() * this.#parts.alienes.length)];
    }

    // guarda el dia con mas visitantes atendidos (premio de velocidad). Se llama
    // justo antes de que el contador del dia se reinicie o de que la partida termine,
    // nunca despues de tocar #dayNumber.
    #recordDayVisitors(): void {
        if (this.#visitorsSeenToday > this.#bestDayVisitors) {
            this.#bestDayVisitors = this.#visitorsSeenToday;
            this.#bestDayNumber = this.#dayNumber;
        }
    }

    // anota que tipo de visitante dejo pasar el jugador (premios de "no se te paso
    // ninguno"). Solo cuenta al aceptar: rechazarlo es justamente no dejarlo pasar.
    #recordLetThrough(visitor: Character): void {
        if (visitor.obtainHaveHorns) {
            this.#letThroughOni = true;
        }
        if (visitor instanceof Yokai && visitor.obtainYokaiType === "kitsune") {
            this.#letThroughKitsune = true;
        }
        if (visitor instanceof Yokai && visitor.obtainYokaiType === "kappa") {
            this.#letThroughKappa = true;
        }
    }

    // true si hoy rige la regla del sello azul (reglas.json, propiedad "selloAlien").
    // La usa decide() y tambien main.ts, para mostrar el sello azul en el escritorio
    // recien el dia en que empieza a hacer falta.
    alienStampRuleActive(): boolean {
        return this.currentDay.getActiveRules().some((rule: Rule) => rule.getProperty() === "selloAlien");
    }

    get hintCost(): number {
        return HINT_COST;
    }

    // tienda: revela que propiedad del visitante actual viola una regla hoy (o
    // null si esta limpio - no hay nada que revelar, pero el costo se cobra
    // igual, es el riesgo de comprarla "a ciegas"). Devuelve null tambien si no
    // alcanza el dinero, sin cobrar nada (la UI ya deshabilita el boton en ese
    // caso, esto es solo una segunda barrera).
    buyHint(): string | null {
        if (this.#money < HINT_COST) {
            return null;
        }
        this.#money -= HINT_COST;
        const visitor = this.#currentVisitor as Character;
        const violatedRule = this.currentDay.evaluateCharacter(visitor);
        return violatedRule === null ? null : violatedRule.getProperty();
    }

    get extraTimeCost(): number {
        return EXTRA_TIME_COST;
    }
    get usedExtraTimeToday(): boolean {
        return this.#usedExtraTimeToday;
    }

    // tienda: cuantos segundos sumar al reloj del dia los pone main.ts
    // (EXTRA_TIME_MS) - aca solo se controla el dinero y el limite de una vez
    // por dia (si no, el reloj de arena, que es la presion central del juego,
    // dejaria de importar)
    buyExtraTime(): boolean {
        if (this.#money < EXTRA_TIME_COST || this.#usedExtraTimeToday) {
            return false;
        }
        this.#money -= EXTRA_TIME_COST;
        this.#usedExtraTimeToday = true;
        return true;
    }

    get insuranceCost(): number {
        return INSURANCE_COST;
    }
    get hasInsurance(): boolean {
        return this.#hasInsurance;
    }

    // tienda: activa el indulto (ver decide()) - un solo indulto activo a la
    // vez, no se puede comprar otro encima del que ya esta activo
    buyInsurance(): boolean {
        if (this.#money < INSURANCE_COST || this.#hasInsurance) {
            return false;
        }
        this.#money -= INSURANCE_COST;
        this.#hasInsurance = true;
        return true;
    }

    // usedAlienStamp = el jugador aprobo con el sello AZUL en vez del verde. Es
    // opcional para no romper a quien llame decide(accept) a secas (los tests, y
    // todo el codigo anterior al dia 6).
    // wasRushed = el jugador decidio casi al toque de abrir el pasaporte (ver
    // RUSH_THRESHOLD_MS en main.ts) - senal de que no lo reviso de verdad. Resta
    // dinero aparte, pero NO suma a #errors: es un descuido de procedimiento,
    // distinto de si la decision en si fue correcta o no (ver especificaciones-
    // economia.md, seccion 4).
    decide(accept: boolean, usedAlienStamp: boolean = false, wasRushed: boolean = false): void {
    const currentDay = this.#days[this.#dayNumber - 1];
    const visitor = this.#currentVisitor as Character;
    const violatedRule = currentDay.evaluateCharacter(visitor);
    const shouldReject = violatedRule !== null; //si se esta violando una regla, el personaje actual debe ser rechazado

    // desde el dia en que rige la regla del sello azul, dejar pasar a un alien exige
    // sellarlo con el AZUL, y el azul no vale para nadie mas. Ojo: esto solo cambia
    // COMO se aprueba - a quien hay que rechazar no cambia en absoluto, un alien que
    // viola cualquiera de las otras reglas se rechaza igual que el resto.
    const needsAlienStamp = this.alienStampRuleActive() && visitor.isAlien();
    const rightStamp = usedAlienStamp === needsAlienStamp;

    const wasCorrect = (accept && !shouldReject && rightStamp) || (!accept && shouldReject);

    if (wasCorrect) {
        this.#money += 2; // antes 10 - se achico porque ahora, con dia por tiempo, se pueden ver muchos mas visitantes que antes
        this.#dayMoney += 2;
    } else {
        this.#money -= 5;
        this.#dayMoney -= 5;
        // el indulto absorbe este error (no cuenta para los 4 que pierden la
        // partida) pero no devuelve el dinero - no es gratis equivocarse, es
        // que no te cuesta la partida. Se consume, no queda para el proximo error.
        if (this.#hasInsurance) {
            this.#hasInsurance = false;
        } else {
            this.#errors += 1;
            this.#dayErrors += 1;
        }
    }

    if (wasRushed) {
        this.#money -= RUSH_PENALTY;
        this.#dayRushPenalty += RUSH_PENALTY;
    }

    this.#visitorsSeenToday += 1;
    if (accept) {
        this.#dayAccepted += 1;
        this.#recordLetThrough(visitor);
    } else {
        this.#dayRejected += 1;
    }

    if (this.isLost()) {
        this.#recordDayVisitors();
        saveToHistory({ day: this.#dayNumber, errors: this.#errors, money: this.#money, result: "derrota", name: this.#playerName, totalDays: this.#totalDays });
        addCredits(this.#playerName, this.#money);
        addResultToStreak("derrota");
        deleteCurrentGame();
        return;
    }

    this.#currentVisitor = this.#generateVisitor();
    }

    // el dia ya no termina por cantidad de visitantes: lo llama main.ts cuando se
    // acaba el temporizador del dia. Antes vivia adentro de decide(), atado a
    // visitorsSeenToday >= currentDay.getVisitorGoal().
    endDay(): void {
    this.#recordDayVisitors(); // antes de tocar #dayNumber: el conteo es del dia que se cierra
    // foto del dia que se cierra, ANTES de que #startDay() (mas abajo) resetee
    // los contadores del dia - ver pantalla de resumen en main.ts
    this.#lastDayAccepted = this.#dayAccepted;
    this.#lastDayRejected = this.#dayRejected;
    this.#lastDayErrors = this.#dayErrors;
    this.#lastDayMoney = this.#dayMoney;
    this.#lastDayCharge = this.#dayCharge;
    this.#lastDayRushPenalty = this.#dayRushPenalty;
    this.#dayNumber += 1;
    if (this.isWon()) {
        saveToHistory({ day: this.#totalDays, errors: this.#errors, money: this.#money, result: "victoria", name: this.#playerName, totalDays: this.#totalDays });
        addCredits(this.#playerName, this.#money);
        addResultToStreak("victoria");
        deleteCurrentGame();
        return;
    }
    this.#chargeDailyCost();
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
    get totalDays(): number {
        return this.#totalDays;
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
    // --- datos para los premios de fin de partida (ver AWARD_BEATS en main.ts) ---
    get letThroughOni(): boolean {
        return this.#letThroughOni;
    }
    get letThroughKitsune(): boolean {
        return this.#letThroughKitsune;
    }
    get letThroughKappa(): boolean {
        return this.#letThroughKappa;
    }
    get bestDayVisitors(): number {
        return this.#bestDayVisitors;
    }
    get bestDayNumber(): number {
        return this.#bestDayNumber;
    }
    // --- datos del ultimo dia cerrado (ver pantalla de resumen en main.ts) ---
    get lastDayAccepted(): number {
        return this.#lastDayAccepted;
    }
    get lastDayRejected(): number {
        return this.#lastDayRejected;
    }
    get lastDayErrors(): number {
        return this.#lastDayErrors;
    }
    get lastDayMoney(): number {
        return this.#lastDayMoney;
    }
    get lastDayCharge(): number {
        return this.#lastDayCharge;
    }
    get lastDayRushPenalty(): number {
        return this.#lastDayRushPenalty;
    }
    // dias terminados de verdad: al perder en el dia 4 quedan 3 completos, y al ganar
    // #dayNumber ya vale #totalDays + 1, asi que quedan los 7
    get daysCompleted(): number {
        return this.#dayNumber - 1;
    }

    loadProgress(): boolean {
    const saved = loadCurrentGame();
    if (saved === null) {
        return false;
    }
    this.#dayNumber = saved.dayNumber;
    this.#errors = saved.errors;
    this.#money = saved.money;
    this.#totalDays = saved.totalDays ?? 7; // partidas guardadas de antes de este dato: 7 por defecto
    this.#startDay();
    return true;
    }
}

