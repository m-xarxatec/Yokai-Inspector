import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, getHistory } from "../Storage.js";
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
    #todayProblematicSlots: boolean [];
    #parts: any;
    #names: string[];
    #phrases: string[]
    #stamps: any[];

    constructor(){
        this.#dayNumber = 1;
        this.#errors = 0;
        this.#money = 10;
        this.#maxErrors = 5;
        this.#totalDays = 5;
        this.#days = [];
        this.#currentVisitor = null;
        this.#visitorsSeenToday = 0;
        this.#todayProblematicSlots = []; 
    }

    loadData(onComplete: () => void): void {
        Promise.all([
            fetch("data/partes.json").then(r => r.json()),
            fetch("data/yokais.json").then(r => r.json()),
            fetch("data/nombres.json").then(r => r.json()),
            fetch("data/frases.json").then(r => r.json()),
            fetch("data/reglas.json").then(r => r.json()),
            fetch("data/dias.json").then(r => r.json()),
            fetch("data/sellos.json").then(r => r.json())]).then(([parts, yokais, names, phrases, rawRules, rawDays, stamps]) =>{
                this.#parts = parts;
                this.#names = names;
                this.#phrases = phrases;
                this.#stamps = stamps;

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

        const goal = this.#days[this.#dayNumber -1].getVisitorGoal();
        const problematicCount = Math.min(this.#dayNumber +1, goal - 1)

        const slots: boolean[] = [];
        for (let i = 0; i< goal; i++){
            slots.push(i < problematicCount)
        }

        this.#todayProblematicSlots = slots.sort(() => Math.random() - 0.5);

        this.#currentVisitor = this.#generateVisitor();
        saveCurrentGame({ dayNumber: this.#dayNumber, errors: this.#errors, money: this.#money})
    }
    #generateVisitor(): Character {
        
        const isProblematic = this.#todayProblematicSlots[this.#visitorsSeenToday];
        const name = this.#names[Math.floor(Math.random() * this.#names.length)];
        const phrase = this.#phrases[Math.floor(Math.random() * this.#phrases.length)];
        const face = this.#parts.rostro[Math.floor(Math.random() * this.#parts.rostro.length)];
        const eyesShape = this.#parts.ojos[Math.floor(Math.random() * this.#parts.ojos.length)];
        const mouth = this.#parts.boca[Math.floor(Math.random() * this.#parts.boca.length)];
        const horns = this.#parts.cuernos[Math.floor(Math.random() * this.#parts.cuernos.length)];
        const hair = this.#parts.sombrero[Math.floor(Math.random() * this.#parts.sombrero.length)];

        if (!isProblematic) {
            const safeRegions = ["campo", "montaña", "ciudad", "playa"];
            const region = safeRegions[Math.floor(Math.random() * safeRegions.length)];
            const safeStamps = ["dorado", "rojo"];
            const stamp = safeStamps[Math.floor(Math.random() * safeStamps.length)]
            const passport = new Passport(name, region, "humano", stamp);
            return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);

        }

        const activeRules = this.#days[this.#dayNumber - 1].getActiveRules();
        const targetRule = activeRules[Math.floor(Math.random() * activeRules.length)];

        let yokaiType = "oni";
        let declaredSpecie = "";
        let region = "campo";
        let stamp = "dorado";

        const property = targetRule.getProperty();

        if (property === "tieneCuernos") {
        yokaiType = "oni";
        declaredSpecie = "oni";};

        if (property === "ojosAmarillos") {
        yokaiType = "kitsune";
        declaredSpecie = "kitsune";};

        if (property === "region") {
        yokaiType = "kappa";
        declaredSpecie = "kappa";
        region = "rio";};
        
        if (property === "mintioSobreEspecie") {
        yokaiType = ["oni", "kitsune", "kappa"][Math.floor(Math.random() * 3)];
        declaredSpecie = "humano"; // la mentira
        if (yokaiType === "kappa") {
            region = "rio";
        }
        }

        if (property === "sello") {
        declaredSpecie = "humano";
        stamp = "negro";
        }

        const passport = new Passport(name, region, declaredSpecie, stamp);

        if (targetRule.getProperty() === "sello" ) {
        return new Human(name, passport, face, eyesShape, false, mouth, horns, false, hair, phrase);
        }
        return new Yokai(name, passport, face, eyesShape, mouth, horns, hair, phrase, yokaiType);
    }

    decide(accept: boolean): void {
    const currentDay = this.#days[this.#dayNumber - 1];
    const violatedRule = currentDay.evaluateCharacter(this.#currentVisitor as Character);
    const shouldReject = violatedRule !== null; //si se esta violando una regla, el personaje actual debe ser rechazado
    const wasCorrect = (accept && !shouldReject) || (!accept && shouldReject);

    if (wasCorrect) {
        this.#money += 10;
    } else {
        this.#money -= 5;
        this.#errors += 1;
    }

    this.#visitorsSeenToday += 1;

    if (this.isLost()) {
        saveToHistory({ day: this.#dayNumber, errors: this.#errors, money: this.#money, result: "derrota" });
        deleteCurrentGame();
        return;
    }

    if (this.#visitorsSeenToday >= currentDay.getVisitorGoal()) {
        this.#dayNumber += 1;
        if (this.isWon()) {
        saveToHistory({ day: this.#totalDays, errors: this.#errors, money: this.#money, result: "victoria" });
        deleteCurrentGame();
        return;
        }
        this.#startDay();
        return;
    }

    this.#currentVisitor = this.#generateVisitor();
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

