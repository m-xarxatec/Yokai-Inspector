import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, getHistory, addCredits, addResultToStreak } from "../Storage.js";
import { Character } from "./Character.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";
import { VisitorGenerator } from "./VisitorGenerator.js";
import { Economy } from "./Economy.js";

export class Game{

    #dayNumber: number;
    #errors: number;
    #money: number;
    #maxErrors: number;
    #totalDays: number;
    #days: Day[];
    #currentVisitor: Character | null;
    #visitorsSeenToday: number;
    #playerName: string;
    #visitorGenerator: VisitorGenerator;
    #economy: Economy;
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
    #lastDayAccepted: number;
    #lastDayRejected: number;
    #lastDayErrors: number;
    #lastDayMoney: number;

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
        this.#visitorGenerator = new VisitorGenerator();
        this.#economy = new Economy();
        this.#letThroughOni = false;
        this.#letThroughKitsune = false;
        this.#letThroughKappa = false;
        this.#bestDayVisitors = 0;
        this.#bestDayNumber = 0;
        this.#dayAccepted = 0;
        this.#dayRejected = 0;
        this.#dayErrors = 0;
        this.#dayMoney = 0;
        this.#lastDayAccepted = 0;
        this.#lastDayRejected = 0;
        this.#lastDayErrors = 0;
        this.#lastDayMoney = 0;
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
                this.#visitorGenerator.setData(parts, names, phrases, stamps, species);

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
        this.#economy.resetForNewDay();
        this.#currentVisitor = this.#visitorGenerator.generate(this.#dayNumber, this.#days[this.#dayNumber - 1]);
        saveCurrentGame({ dayNumber: this.#dayNumber, errors: this.#errors, money: this.#money, totalDays: this.#totalDays})
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
        return this.#economy.hintCost;
    }

    // tienda: revela que propiedad del visitante actual viola una regla hoy (o
    // null si esta limpio - no hay nada que revelar, pero el costo se cobra
    // igual, es el riesgo de comprarla "a ciegas"). Devuelve null tambien si no
    // alcanza el dinero, sin cobrar nada (la UI ya deshabilita el boton en ese
    // caso, esto es solo una segunda barrera).
    buyHint(): string | null {
        if (this.#money < this.#economy.hintCost) {
            return null;
        }
        this.#money -= this.#economy.hintCost;
        const visitor = this.#currentVisitor as Character;
        const violatedRule = this.currentDay.evaluateCharacter(visitor);
        return violatedRule === null ? null : violatedRule.getProperty();
    }

    get extraTimeCost(): number {
        return this.#economy.extraTimeCost;
    }
    get usedExtraTimeToday(): boolean {
        return this.#economy.usedExtraTimeToday;
    }

    // tienda: cuantos segundos sumar al reloj del dia los pone main.ts
    // (EXTRA_TIME_MS) - aca solo se controla el dinero y el limite de una vez
    // por dia (si no, el reloj de arena, que es la presion central del juego,
    // dejaria de importar)
    buyExtraTime(): boolean {
        const cost = this.#economy.tryBuyExtraTime(this.#money);
        if (cost === 0) {
            return false;
        }
        this.#money -= cost;
        return true;
    }

    get insuranceCost(): number {
        return this.#economy.insuranceCost;
    }
    get hasInsurance(): boolean {
        return this.#economy.hasInsurance;
    }

    // tienda: activa el indulto (ver decide()) - un solo indulto activo a la
    // vez, no se puede comprar otro encima del que ya esta activo
    buyInsurance(): boolean {
        const cost = this.#economy.tryBuyInsurance(this.#money);
        if (cost === 0) {
            return false;
        }
        this.#money -= cost;
        return true;
    }

    // usedAlienStamp = el jugador aprobo con el sello AZUL en vez del verde. Es
    // opcional para no romper a quien llame decide(accept) a secas (los tests, y
    // todo el codigo anterior al dia 6).
    // wasRushed = el jugador decidio casi al toque de abrir el pasaporte (ver
    // RUSH_THRESHOLD_MS en main.ts) - senal de que no lo reviso de verdad. Resta
    // dinero aparte, pero NO suma a #errors: es un descuido de procedimiento,
    // distinto de si la decision en si fue correcta o no.
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
        if (!this.#economy.consumeInsuranceIfActive()) {
            this.#errors += 1;
            this.#dayErrors += 1;
        }
    }

    if (wasRushed) {
        this.#money -= this.#economy.recordRushPenalty();
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

    this.#currentVisitor = this.#visitorGenerator.generate(this.#dayNumber, this.#days[this.#dayNumber - 1]);
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
    this.#economy.snapshotDayEnd();
    this.#dayNumber += 1;
    if (this.isWon()) {
        saveToHistory({ day: this.#totalDays, errors: this.#errors, money: this.#money, result: "victoria", name: this.#playerName, totalDays: this.#totalDays });
        addCredits(this.#playerName, this.#money);
        addResultToStreak("victoria");
        deleteCurrentGame();
        return;
    }
    this.#money -= this.#economy.chargeDailyCost(this.currentDay.getActiveRules().length);
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
        return this.#economy.lastDayCharge;
    }
    get lastDayRushPenalty(): number {
        return this.#economy.lastDayRushPenalty;
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
