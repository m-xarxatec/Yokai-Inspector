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
var _Game_instances, _Game_dayNumber, _Game_errors, _Game_money, _Game_maxErrors, _Game_totalDays, _Game_days, _Game_currentVisitor, _Game_visitorsSeenToday, _Game_todayProblematicSlots, _Game_parts, _Game_names, _Game_phrases, _Game_stamps, _Game_startDay, _Game_generateVisitor;
import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory } from "../Storage.js";
import { Passport } from "./Passport.js";
import { Human } from "./Human.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";
export class Game {
    constructor() {
        _Game_instances.add(this);
        _Game_dayNumber.set(this, void 0);
        _Game_errors.set(this, void 0);
        _Game_money.set(this, void 0);
        _Game_maxErrors.set(this, void 0);
        _Game_totalDays.set(this, void 0);
        _Game_days.set(this, void 0);
        _Game_currentVisitor.set(this, void 0);
        _Game_visitorsSeenToday.set(this, void 0);
        _Game_todayProblematicSlots.set(this, void 0);
        _Game_parts.set(this, void 0);
        _Game_names.set(this, void 0);
        _Game_phrases.set(this, void 0);
        _Game_stamps.set(this, void 0);
        __classPrivateFieldSet(this, _Game_dayNumber, 1, "f");
        __classPrivateFieldSet(this, _Game_errors, 0, "f");
        __classPrivateFieldSet(this, _Game_money, 10, "f");
        __classPrivateFieldSet(this, _Game_maxErrors, 5, "f");
        __classPrivateFieldSet(this, _Game_totalDays, 5, "f");
        __classPrivateFieldSet(this, _Game_days, [], "f");
        __classPrivateFieldSet(this, _Game_currentVisitor, null, "f");
        __classPrivateFieldSet(this, _Game_visitorsSeenToday, 0, "f");
        __classPrivateFieldSet(this, _Game_todayProblematicSlots, [], "f");
    }
    loadData(onComplete) {
        Promise.all([
            fetch("data/partes.json").then(r => r.json()),
            fetch("data/yokais.json").then(r => r.json()),
            fetch("data/nombres.json").then(r => r.json()),
            fetch("data/frases.json").then(r => r.json()),
            fetch("data/reglas.json").then(r => r.json()),
            fetch("data/dias.json").then(r => r.json()),
            fetch("data/sellos.json").then(r => r.json())
        ]).then(([parts, yokais, names, phrases, rawRules, rawDays, stamps]) => {
            __classPrivateFieldSet(this, _Game_parts, parts, "f");
            __classPrivateFieldSet(this, _Game_names, names, "f");
            __classPrivateFieldSet(this, _Game_phrases, phrases, "f");
            __classPrivateFieldSet(this, _Game_stamps, stamps, "f");
            const rules = rawRules.map((r) => new Rule(r.dia, r.propiedad, r.valorProhibido, r.descripcion));
            __classPrivateFieldSet(this, _Game_days, rawDays.map((d) => {
                const activeRules = rules.filter((rule) => d.reglasActivas.includes(rule.getDay()));
                return new Day(d.dia, d.objetivoVisitantes, activeRules, d.mensajeIntro);
            }), "f");
            onComplete();
        }).catch(error => {
            console.log("no se pudieron cargar los datos del juego");
            window.alert("hubo un problema cargando el juego, mira la consola para detectarlo");
        });
    }
    startNewGame() {
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_startDay).call(this);
    }
    decide(accept) {
        const currentDay = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1];
        const violatedRule = currentDay.evaluateCharacter(__classPrivateFieldGet(this, _Game_currentVisitor, "f"));
        const shouldReject = violatedRule !== null; //si se esta violando una regla, el personaje actual debe ser rechazado
        const wasCorrect = (accept && !shouldReject) || (!accept && shouldReject);
        if (wasCorrect) {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") + 10, "f");
        }
        else {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - 5, "f");
            __classPrivateFieldSet(this, _Game_errors, __classPrivateFieldGet(this, _Game_errors, "f") + 1, "f");
        }
        __classPrivateFieldSet(this, _Game_visitorsSeenToday, __classPrivateFieldGet(this, _Game_visitorsSeenToday, "f") + 1, "f");
        if (this.isLost()) {
            saveToHistory({ day: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), result: "derrota" });
            deleteCurrentGame();
            return;
        }
        if (__classPrivateFieldGet(this, _Game_visitorsSeenToday, "f") >= currentDay.getVisitorGoal()) {
            __classPrivateFieldSet(this, _Game_dayNumber, __classPrivateFieldGet(this, _Game_dayNumber, "f") + 1, "f");
            if (this.isWon()) {
                saveToHistory({ day: __classPrivateFieldGet(this, _Game_totalDays, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), result: "victoria" });
                deleteCurrentGame();
                return;
            }
            __classPrivateFieldGet(this, _Game_instances, "m", _Game_startDay).call(this);
            return;
        }
        __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_instances, "m", _Game_generateVisitor).call(this), "f");
    }
    isLost() {
        return __classPrivateFieldGet(this, _Game_errors, "f") >= __classPrivateFieldGet(this, _Game_maxErrors, "f");
    }
    isWon() {
        return __classPrivateFieldGet(this, _Game_dayNumber, "f") > __classPrivateFieldGet(this, _Game_totalDays, "f");
    }
    get dayNumber() {
        return __classPrivateFieldGet(this, _Game_dayNumber, "f");
    }
    get errors() {
        return __classPrivateFieldGet(this, _Game_errors, "f");
    }
    get money() {
        return __classPrivateFieldGet(this, _Game_money, "f");
    }
    get currentVisitor() {
        return __classPrivateFieldGet(this, _Game_currentVisitor, "f");
    }
    get currentDay() {
        return __classPrivateFieldGet(this, _Game_days, "f")[Math.min(__classPrivateFieldGet(this, _Game_dayNumber, "f"), __classPrivateFieldGet(this, _Game_totalDays, "f")) - 1];
    }
    loadProgress() {
        const saved = loadCurrentGame();
        if (saved === null) {
            return false;
        }
        __classPrivateFieldSet(this, _Game_dayNumber, saved.dayNumber, "f");
        __classPrivateFieldSet(this, _Game_errors, saved.errors, "f");
        __classPrivateFieldSet(this, _Game_money, saved.money, "f");
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_startDay).call(this);
        return true;
    }
}
_Game_dayNumber = new WeakMap(), _Game_errors = new WeakMap(), _Game_money = new WeakMap(), _Game_maxErrors = new WeakMap(), _Game_totalDays = new WeakMap(), _Game_days = new WeakMap(), _Game_currentVisitor = new WeakMap(), _Game_visitorsSeenToday = new WeakMap(), _Game_todayProblematicSlots = new WeakMap(), _Game_parts = new WeakMap(), _Game_names = new WeakMap(), _Game_phrases = new WeakMap(), _Game_stamps = new WeakMap(), _Game_instances = new WeakSet(), _Game_startDay = function _Game_startDay() {
    __classPrivateFieldSet(this, _Game_visitorsSeenToday, 0, "f");
    const goal = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1].getVisitorGoal();
    const problematicCount = Math.min(__classPrivateFieldGet(this, _Game_dayNumber, "f") + 1, goal - 1);
    const slots = [];
    for (let i = 0; i < goal; i++) {
        slots.push(i < problematicCount);
    }
    __classPrivateFieldSet(this, _Game_todayProblematicSlots, slots.sort(() => Math.random() - 0.5), "f");
    __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_instances, "m", _Game_generateVisitor).call(this), "f");
    saveCurrentGame({ dayNumber: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f") });
}, _Game_generateVisitor = function _Game_generateVisitor() {
    const isProblematic = __classPrivateFieldGet(this, _Game_todayProblematicSlots, "f")[__classPrivateFieldGet(this, _Game_visitorsSeenToday, "f")];
    const name = __classPrivateFieldGet(this, _Game_names, "f")[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_names, "f").length)];
    const phrase = __classPrivateFieldGet(this, _Game_phrases, "f")[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_phrases, "f").length)];
    const face = __classPrivateFieldGet(this, _Game_parts, "f").rostro[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").rostro.length)];
    const eyesShape = __classPrivateFieldGet(this, _Game_parts, "f").ojos[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").ojos.length)];
    const nose = __classPrivateFieldGet(this, _Game_parts, "f").nariz[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").nariz.length)];
    const ear = __classPrivateFieldGet(this, _Game_parts, "f").orejas[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").orejas.length)];
    const horns = __classPrivateFieldGet(this, _Game_parts, "f").cuernos[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").cuernos.length)];
    const hair = __classPrivateFieldGet(this, _Game_parts, "f").sombrero[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").sombrero.length)];
    if (!isProblematic) {
        const safeRegions = ["campo", "montaña", "ciudad", "playa"];
        const region = safeRegions[Math.floor(Math.random() * safeRegions.length)];
        const safeStamps = ["dorado", "rojo"];
        const stamp = safeStamps[Math.floor(Math.random() * safeStamps.length)];
        const passport = new Passport(name, region, "humano", stamp);
        return new Human(name, passport, face, eyesShape, false, nose, ear, horns, false, hair, phrase);
    }
    const activeRules = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1].getActiveRules();
    const targetRule = activeRules[Math.floor(Math.random() * activeRules.length)];
    let yokaiType = "oni";
    let declaredSpecie = "";
    let region = "campo";
    let stamp = "dorado";
    const property = targetRule.getProperty();
    if (property === "tieneCuernos") {
        yokaiType = "oni";
        declaredSpecie = "oni";
    }
    ;
    if (property === "ojosAmarillos") {
        yokaiType = "kitsune";
        declaredSpecie = "kitsune";
    }
    ;
    if (property === "region") {
        yokaiType = "kappa";
        declaredSpecie = "kappa";
        region = "rio";
    }
    ;
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
    if (targetRule.getProperty() === "sello") {
        return new Human(name, passport, face, eyesShape, false, nose, ear, horns, false, hair, phrase);
    }
    return new Yokai(name, passport, face, eyesShape, nose, ear, horns, hair, phrase, yokaiType);
};
//# sourceMappingURL=Game.js.map