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
var _Game_instances, _Game_dayNumber, _Game_errors, _Game_money, _Game_maxErrors, _Game_totalDays, _Game_days, _Game_currentVisitor, _Game_visitorsSeenToday, _Game_playerName, _Game_visitorGenerator, _Game_economy, _Game_letThroughOni, _Game_letThroughKitsune, _Game_letThroughKappa, _Game_bestDayVisitors, _Game_bestDayNumber, _Game_dayAccepted, _Game_dayRejected, _Game_dayErrors, _Game_dayMoney, _Game_lastDayAccepted, _Game_lastDayRejected, _Game_lastDayErrors, _Game_lastDayMoney, _Game_startDay, _Game_generateNextVisitor, _Game_recordDayVisitors, _Game_recordLetThrough;
import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, addCredits, addResultToStreak } from "../Storage.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";
import { VisitorGenerator } from "./VisitorGenerator.js";
import { Economy } from "./Economy.js";
export class Game {
    constructor(playerName = "Jugador", totalDays = 7) {
        _Game_instances.add(this);
        _Game_dayNumber.set(this, void 0);
        _Game_errors.set(this, void 0);
        _Game_money.set(this, void 0);
        _Game_maxErrors.set(this, void 0);
        _Game_totalDays.set(this, void 0);
        _Game_days.set(this, void 0);
        _Game_currentVisitor.set(this, void 0);
        _Game_visitorsSeenToday.set(this, void 0);
        _Game_playerName.set(this, void 0);
        _Game_visitorGenerator.set(this, void 0);
        _Game_economy.set(this, void 0);
        _Game_letThroughOni.set(this, void 0);
        _Game_letThroughKitsune.set(this, void 0);
        _Game_letThroughKappa.set(this, void 0);
        _Game_bestDayVisitors.set(this, void 0);
        _Game_bestDayNumber.set(this, void 0);
        _Game_dayAccepted.set(this, void 0);
        _Game_dayRejected.set(this, void 0);
        _Game_dayErrors.set(this, void 0);
        _Game_dayMoney.set(this, void 0);
        _Game_lastDayAccepted.set(this, void 0);
        _Game_lastDayRejected.set(this, void 0);
        _Game_lastDayErrors.set(this, void 0);
        _Game_lastDayMoney.set(this, void 0);
        __classPrivateFieldSet(this, _Game_playerName, playerName.trim() !== "" ? playerName : "Jugador", "f");
        __classPrivateFieldSet(this, _Game_dayNumber, 1, "f");
        __classPrivateFieldSet(this, _Game_errors, 0, "f");
        __classPrivateFieldSet(this, _Game_money, 10, "f");
        __classPrivateFieldSet(this, _Game_maxErrors, 4, "f");
        __classPrivateFieldSet(this, _Game_totalDays, totalDays, "f");
        __classPrivateFieldSet(this, _Game_days, [], "f");
        __classPrivateFieldSet(this, _Game_currentVisitor, null, "f");
        __classPrivateFieldSet(this, _Game_visitorsSeenToday, 0, "f");
        __classPrivateFieldSet(this, _Game_visitorGenerator, new VisitorGenerator(), "f");
        __classPrivateFieldSet(this, _Game_economy, new Economy(), "f");
        __classPrivateFieldSet(this, _Game_letThroughOni, false, "f");
        __classPrivateFieldSet(this, _Game_letThroughKitsune, false, "f");
        __classPrivateFieldSet(this, _Game_letThroughKappa, false, "f");
        __classPrivateFieldSet(this, _Game_bestDayVisitors, 0, "f");
        __classPrivateFieldSet(this, _Game_bestDayNumber, 0, "f");
        __classPrivateFieldSet(this, _Game_dayAccepted, 0, "f");
        __classPrivateFieldSet(this, _Game_dayRejected, 0, "f");
        __classPrivateFieldSet(this, _Game_dayErrors, 0, "f");
        __classPrivateFieldSet(this, _Game_dayMoney, 0, "f");
        __classPrivateFieldSet(this, _Game_lastDayAccepted, 0, "f");
        __classPrivateFieldSet(this, _Game_lastDayRejected, 0, "f");
        __classPrivateFieldSet(this, _Game_lastDayErrors, 0, "f");
        __classPrivateFieldSet(this, _Game_lastDayMoney, 0, "f");
    }
    loadData(onComplete) {
        // ojo: data/yokais.json (id/nombre/rasgoReal de oni-kitsune-kappa) ya NO se
        // usa - VisitorGenerator.generate() sortea los rasgos reales directo, sin
        // pasar por ese archivo. Se dejo de pedir (fetch) porque bajarlo y no usarlo
        // para nada era trabajo de mas.
        Promise.all([
            fetch("data/partes.json").then(r => r.json()),
            fetch("data/nombres.json").then(r => r.json()),
            fetch("data/frases.json").then(r => r.json()),
            fetch("data/reglas.json").then(r => r.json()),
            fetch("data/dias.json").then(r => r.json()),
            fetch("data/sellos.json").then(r => r.json()),
            fetch("data/species.json").then(r => r.json())
        ]).then(([parts, names, phrases, rawRules, rawDays, stamps, species]) => {
            __classPrivateFieldGet(this, _Game_visitorGenerator, "f").setData(parts, names, phrases, stamps, species);
            const rules = rawRules.map((r) => new Rule(r.dia, r.propiedad, r.valorProhibido, r.descripcion));
            __classPrivateFieldSet(this, _Game_days, rawDays.map((d) => {
                const activeRules = rules.filter((rule) => d.reglasActivas.includes(rule.getDay()));
                return new Day(d.dia, d.objetivoVisitantes, activeRules, d.mensajeIntro);
            }), "f");
            onComplete();
        }).catch(error => {
            // se deja el error real en la consola (antes se perdia) para poder
            // ver QUE fallo, no solo que algo fallo
            console.log("no se pudieron cargar los datos del juego", error);
            window.alert("hubo un problema cargando el juego, mira la consola para detectarlo");
        });
    }
    startNewGame() {
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_startDay).call(this);
    }
    alienStampRuleActive() {
        return this.currentDay.getActiveRules().some((rule) => rule.getProperty() === "selloAlien");
    }
    get hintCost() {
        return __classPrivateFieldGet(this, _Game_economy, "f").hintCost;
    }
    buyHint() {
        if (__classPrivateFieldGet(this, _Game_money, "f") < __classPrivateFieldGet(this, _Game_economy, "f").hintCost) {
            return null;
        }
        __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - __classPrivateFieldGet(this, _Game_economy, "f").hintCost, "f");
        const visitor = __classPrivateFieldGet(this, _Game_currentVisitor, "f");
        const violatedRule = this.currentDay.evaluateCharacter(visitor);
        return violatedRule === null ? null : violatedRule.getProperty();
    }
    get extraTimeCost() {
        return __classPrivateFieldGet(this, _Game_economy, "f").extraTimeCost;
    }
    get usedExtraTimeToday() {
        return __classPrivateFieldGet(this, _Game_economy, "f").usedExtraTimeToday;
    }
    buyExtraTime() {
        const cost = __classPrivateFieldGet(this, _Game_economy, "f").tryBuyExtraTime(__classPrivateFieldGet(this, _Game_money, "f"));
        if (cost === 0) {
            return false;
        }
        __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - cost, "f");
        return true;
    }
    get insuranceCost() {
        return __classPrivateFieldGet(this, _Game_economy, "f").insuranceCost;
    }
    get hasInsurance() {
        return __classPrivateFieldGet(this, _Game_economy, "f").hasInsurance;
    }
    buyInsurance() {
        const cost = __classPrivateFieldGet(this, _Game_economy, "f").tryBuyInsurance(__classPrivateFieldGet(this, _Game_money, "f"));
        if (cost === 0) {
            return false;
        }
        __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - cost, "f");
        return true;
    }
    decide(accept, usedAlienStamp = false, wasRushed = false) {
        const currentDay = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1];
        const visitor = __classPrivateFieldGet(this, _Game_currentVisitor, "f");
        const violatedRule = currentDay.evaluateCharacter(visitor);
        const shouldReject = violatedRule !== null;
        const needsAlienStamp = this.alienStampRuleActive() && visitor.isAlien();
        const rightStamp = usedAlienStamp === needsAlienStamp;
        const wasCorrect = (accept && !shouldReject && rightStamp) || (!accept && shouldReject);
        if (wasCorrect) {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") + 2, "f");
            __classPrivateFieldSet(this, _Game_dayMoney, __classPrivateFieldGet(this, _Game_dayMoney, "f") + 2, "f");
        }
        else {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - 5, "f");
            __classPrivateFieldSet(this, _Game_dayMoney, __classPrivateFieldGet(this, _Game_dayMoney, "f") - 5, "f");
            if (!__classPrivateFieldGet(this, _Game_economy, "f").consumeInsuranceIfActive()) {
                __classPrivateFieldSet(this, _Game_errors, __classPrivateFieldGet(this, _Game_errors, "f") + 1, "f");
                __classPrivateFieldSet(this, _Game_dayErrors, __classPrivateFieldGet(this, _Game_dayErrors, "f") + 1, "f");
            }
        }
        if (wasRushed) {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - __classPrivateFieldGet(this, _Game_economy, "f").recordRushPenalty(), "f");
        }
        __classPrivateFieldSet(this, _Game_visitorsSeenToday, __classPrivateFieldGet(this, _Game_visitorsSeenToday, "f") + 1, "f");
        if (accept) {
            __classPrivateFieldSet(this, _Game_dayAccepted, __classPrivateFieldGet(this, _Game_dayAccepted, "f") + 1, "f");
            __classPrivateFieldGet(this, _Game_instances, "m", _Game_recordLetThrough).call(this, visitor);
        }
        else {
            __classPrivateFieldSet(this, _Game_dayRejected, __classPrivateFieldGet(this, _Game_dayRejected, "f") + 1, "f");
        }
        if (this.isLost()) {
            __classPrivateFieldGet(this, _Game_instances, "m", _Game_recordDayVisitors).call(this);
            saveToHistory({ day: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), result: "derrota", name: __classPrivateFieldGet(this, _Game_playerName, "f"), totalDays: __classPrivateFieldGet(this, _Game_totalDays, "f") });
            addCredits(__classPrivateFieldGet(this, _Game_playerName, "f"), __classPrivateFieldGet(this, _Game_money, "f"));
            addResultToStreak("derrota");
            deleteCurrentGame();
            return;
        }
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_generateNextVisitor).call(this);
    }
    endDay() {
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_recordDayVisitors).call(this);
        __classPrivateFieldSet(this, _Game_lastDayAccepted, __classPrivateFieldGet(this, _Game_dayAccepted, "f"), "f");
        __classPrivateFieldSet(this, _Game_lastDayRejected, __classPrivateFieldGet(this, _Game_dayRejected, "f"), "f");
        __classPrivateFieldSet(this, _Game_lastDayErrors, __classPrivateFieldGet(this, _Game_dayErrors, "f"), "f");
        __classPrivateFieldSet(this, _Game_lastDayMoney, __classPrivateFieldGet(this, _Game_dayMoney, "f"), "f");
        __classPrivateFieldGet(this, _Game_economy, "f").snapshotDayEnd();
        __classPrivateFieldSet(this, _Game_dayNumber, __classPrivateFieldGet(this, _Game_dayNumber, "f") + 1, "f");
        if (this.isWon()) {
            saveToHistory({ day: __classPrivateFieldGet(this, _Game_totalDays, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), result: "victoria", name: __classPrivateFieldGet(this, _Game_playerName, "f"), totalDays: __classPrivateFieldGet(this, _Game_totalDays, "f") });
            addCredits(__classPrivateFieldGet(this, _Game_playerName, "f"), __classPrivateFieldGet(this, _Game_money, "f"));
            addResultToStreak("victoria");
            deleteCurrentGame();
            return;
        }
        __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - __classPrivateFieldGet(this, _Game_economy, "f").chargeDailyCost(this.currentDay.getActiveRules().length), "f");
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_startDay).call(this);
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
    get totalDays() {
        return __classPrivateFieldGet(this, _Game_totalDays, "f");
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
    get playerName() {
        return __classPrivateFieldGet(this, _Game_playerName, "f");
    }
    get letThroughOni() {
        return __classPrivateFieldGet(this, _Game_letThroughOni, "f");
    }
    get letThroughKitsune() {
        return __classPrivateFieldGet(this, _Game_letThroughKitsune, "f");
    }
    get letThroughKappa() {
        return __classPrivateFieldGet(this, _Game_letThroughKappa, "f");
    }
    get bestDayVisitors() {
        return __classPrivateFieldGet(this, _Game_bestDayVisitors, "f");
    }
    get bestDayNumber() {
        return __classPrivateFieldGet(this, _Game_bestDayNumber, "f");
    }
    get lastDayAccepted() {
        return __classPrivateFieldGet(this, _Game_lastDayAccepted, "f");
    }
    get lastDayRejected() {
        return __classPrivateFieldGet(this, _Game_lastDayRejected, "f");
    }
    get lastDayErrors() {
        return __classPrivateFieldGet(this, _Game_lastDayErrors, "f");
    }
    get lastDayMoney() {
        return __classPrivateFieldGet(this, _Game_lastDayMoney, "f");
    }
    get lastDayCharge() {
        return __classPrivateFieldGet(this, _Game_economy, "f").lastDayCharge;
    }
    get lastDayRushPenalty() {
        return __classPrivateFieldGet(this, _Game_economy, "f").lastDayRushPenalty;
    }
    get daysCompleted() {
        return __classPrivateFieldGet(this, _Game_dayNumber, "f") - 1;
    }
    loadProgress() {
        const saved = loadCurrentGame();
        if (saved === null) {
            return false;
        }
        __classPrivateFieldSet(this, _Game_dayNumber, saved.dayNumber, "f");
        __classPrivateFieldSet(this, _Game_errors, saved.errors, "f");
        __classPrivateFieldSet(this, _Game_money, saved.money, "f");
        __classPrivateFieldSet(this, _Game_totalDays, saved.totalDays ?? 7, "f");
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_startDay).call(this);
        return true;
    }
}
_Game_dayNumber = new WeakMap(), _Game_errors = new WeakMap(), _Game_money = new WeakMap(), _Game_maxErrors = new WeakMap(), _Game_totalDays = new WeakMap(), _Game_days = new WeakMap(), _Game_currentVisitor = new WeakMap(), _Game_visitorsSeenToday = new WeakMap(), _Game_playerName = new WeakMap(), _Game_visitorGenerator = new WeakMap(), _Game_economy = new WeakMap(), _Game_letThroughOni = new WeakMap(), _Game_letThroughKitsune = new WeakMap(), _Game_letThroughKappa = new WeakMap(), _Game_bestDayVisitors = new WeakMap(), _Game_bestDayNumber = new WeakMap(), _Game_dayAccepted = new WeakMap(), _Game_dayRejected = new WeakMap(), _Game_dayErrors = new WeakMap(), _Game_dayMoney = new WeakMap(), _Game_lastDayAccepted = new WeakMap(), _Game_lastDayRejected = new WeakMap(), _Game_lastDayErrors = new WeakMap(), _Game_lastDayMoney = new WeakMap(), _Game_instances = new WeakSet(), _Game_startDay = function _Game_startDay() {
    __classPrivateFieldSet(this, _Game_visitorsSeenToday, 0, "f");
    __classPrivateFieldSet(this, _Game_dayAccepted, 0, "f");
    __classPrivateFieldSet(this, _Game_dayRejected, 0, "f");
    __classPrivateFieldSet(this, _Game_dayErrors, 0, "f");
    __classPrivateFieldSet(this, _Game_dayMoney, 0, "f");
    __classPrivateFieldGet(this, _Game_economy, "f").resetForNewDay();
    __classPrivateFieldGet(this, _Game_instances, "m", _Game_generateNextVisitor).call(this);
    saveCurrentGame({ dayNumber: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), totalDays: __classPrivateFieldGet(this, _Game_totalDays, "f") });
}, _Game_generateNextVisitor = function _Game_generateNextVisitor() {
    __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_visitorGenerator, "f").generate(__classPrivateFieldGet(this, _Game_dayNumber, "f"), __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1]), "f");
}, _Game_recordDayVisitors = function _Game_recordDayVisitors() {
    if (__classPrivateFieldGet(this, _Game_visitorsSeenToday, "f") > __classPrivateFieldGet(this, _Game_bestDayVisitors, "f")) {
        __classPrivateFieldSet(this, _Game_bestDayVisitors, __classPrivateFieldGet(this, _Game_visitorsSeenToday, "f"), "f");
        __classPrivateFieldSet(this, _Game_bestDayNumber, __classPrivateFieldGet(this, _Game_dayNumber, "f"), "f");
    }
}, _Game_recordLetThrough = function _Game_recordLetThrough(visitor) {
    if (visitor.obtainHaveHorns) {
        __classPrivateFieldSet(this, _Game_letThroughOni, true, "f");
    }
    if (visitor instanceof Yokai && visitor.obtainYokaiType === "kitsune") {
        __classPrivateFieldSet(this, _Game_letThroughKitsune, true, "f");
    }
    if (visitor instanceof Yokai && visitor.obtainYokaiType === "kappa") {
        __classPrivateFieldSet(this, _Game_letThroughKappa, true, "f");
    }
};
//# sourceMappingURL=Game.js.map