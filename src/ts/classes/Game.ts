import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, addCredits, addResultToStreak } from "../Storage.js";
import { Character } from "./Character.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";
import { VisitorGenerator } from "./VisitorGenerator.js";
import { Economy } from "./Economy.js";

export class Game {

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
    #letThroughOni: boolean;
    #letThroughKitsune: boolean;
    #letThroughKappa: boolean;
    #bestDayVisitors: number;
    #bestDayNumber: number;
    #dayAccepted: number;
    #dayRejected: number;
    #dayErrors: number;
    #dayMoney: number;
    #lastDayAccepted: number;
    #lastDayRejected: number;
    #lastDayErrors: number;
    #lastDayMoney: number;

    constructor(playerName: string = "Jugador", totalDays: number = 7) {
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
            fetch("data/species.json").then(r => r.json())]).then(([parts, yokais, names, phrases, rawRules, rawDays, stamps, species]) => {
                this.#visitorGenerator.setData(parts, names, phrases, stamps, species);

                const rules = rawRules.map((r: any) => new Rule(r.dia, r.propiedad, r.valorProhibido, r.descripcion));
                this.#days = rawDays.map((d: any) => {
                    const activeRules = rules.filter((rule: Rule) => d.reglasActivas.includes(rule.getDay()));
                    return new Day(d.dia, d.objetivoVisitantes, activeRules, d.mensajeIntro);
                });

                onComplete();
            }).catch(error => {
                console.log("no se pudieron cargar los datos del juego");
                window.alert("hubo un problema cargando el juego, mira la consola para detectarlo");
            });
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
        saveCurrentGame({ dayNumber: this.#dayNumber, errors: this.#errors, money: this.#money, totalDays: this.#totalDays });
    }

    #recordDayVisitors(): void {
        if (this.#visitorsSeenToday > this.#bestDayVisitors) {
            this.#bestDayVisitors = this.#visitorsSeenToday;
            this.#bestDayNumber = this.#dayNumber;
        }
    }

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

    alienStampRuleActive(): boolean {
        return this.currentDay.getActiveRules().some((rule: Rule) => rule.getProperty() === "selloAlien");
    }

    get hintCost(): number {
        return this.#economy.hintCost;
    }

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

    buyInsurance(): boolean {
        const cost = this.#economy.tryBuyInsurance(this.#money);
        if (cost === 0) {
            return false;
        }
        this.#money -= cost;
        return true;
    }

    decide(accept: boolean, usedAlienStamp: boolean = false, wasRushed: boolean = false): void {
        const currentDay = this.#days[this.#dayNumber - 1];
        const visitor = this.#currentVisitor as Character;
        const violatedRule = currentDay.evaluateCharacter(visitor);
        const shouldReject = violatedRule !== null;

        const needsAlienStamp = this.alienStampRuleActive() && visitor.isAlien();
        const rightStamp = usedAlienStamp === needsAlienStamp;

        const wasCorrect = (accept && !shouldReject && rightStamp) || (!accept && shouldReject);

        if (wasCorrect) {
            this.#money += 2;
            this.#dayMoney += 2;
        } else {
            this.#money -= 5;
            this.#dayMoney -= 5;
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

    endDay(): void {
        this.#recordDayVisitors();
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
        this.#totalDays = saved.totalDays ?? 7;
        this.#startDay();
        return true;
    }
}
