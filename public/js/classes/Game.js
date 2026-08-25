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
var _Game_instances, _Game_dayNumber, _Game_errors, _Game_money, _Game_maxErrors, _Game_totalDays, _Game_days, _Game_currentVisitor, _Game_visitorsSeenToday, _Game_playerName, _Game_visitorGenerator, _Game_economy, _Game_letThroughOni, _Game_letThroughKitsune, _Game_letThroughKappa, _Game_bestDayVisitors, _Game_bestDayNumber, _Game_dayAccepted, _Game_dayRejected, _Game_dayErrors, _Game_dayMoney, _Game_lastDayAccepted, _Game_lastDayRejected, _Game_lastDayErrors, _Game_lastDayMoney, _Game_startDay, _Game_recordDayVisitors, _Game_recordLetThrough;
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
        // datos que solo se usan para los premios de fin de partida (ver main.ts,
        // AWARD_BEATS): que tipo de visitante dejo pasar el jugador alguna vez, y cual
        // fue su dia con mas visitantes atendidos
        _Game_letThroughOni.set(this, void 0);
        _Game_letThroughKitsune.set(this, void 0);
        _Game_letThroughKappa.set(this, void 0);
        _Game_bestDayVisitors.set(this, void 0);
        _Game_bestDayNumber.set(this, void 0);
        // contadores del dia EN CURSO (se resetean en #startDay(), igual que
        // #visitorsSeenToday) y una "foto" del ultimo dia ya cerrado (necesaria
        // porque endDay() ya llama a #startDay() -que resetea los contadores del
        // dia- antes de que main.ts llegue a leerlos, ver pantalla de resumen)
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
        Promise.all([
            fetch("data/partes.json").then(r => r.json()),
            fetch("data/yokais.json").then(r => r.json()),
            fetch("data/nombres.json").then(r => r.json()),
            fetch("data/frases.json").then(r => r.json()),
            fetch("data/reglas.json").then(r => r.json()),
            fetch("data/dias.json").then(r => r.json()),
            fetch("data/sellos.json").then(r => r.json()),
            fetch("data/species.json").then(r => r.json())
        ]).then(([parts, yokais, names, phrases, rawRules, rawDays, stamps, species]) => {
            __classPrivateFieldGet(this, _Game_visitorGenerator, "f").setData(parts, names, phrases, stamps, species);
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
    // true si hoy rige la regla del sello azul (reglas.json, propiedad "selloAlien").
    // La usa decide() y tambien main.ts, para mostrar el sello azul en el escritorio
    // recien el dia en que empieza a hacer falta.
    alienStampRuleActive() {
        return this.currentDay.getActiveRules().some((rule) => rule.getProperty() === "selloAlien");
    }
    get hintCost() {
        return __classPrivateFieldGet(this, _Game_economy, "f").hintCost;
    }
    // tienda: revela que propiedad del visitante actual viola una regla hoy (o
    // null si esta limpio - no hay nada que revelar, pero el costo se cobra
    // igual, es el riesgo de comprarla "a ciegas"). Devuelve null tambien si no
    // alcanza el dinero, sin cobrar nada (la UI ya deshabilita el boton en ese
    // caso, esto es solo una segunda barrera).
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
    // tienda: cuantos segundos sumar al reloj del dia los pone main.ts
    // (EXTRA_TIME_MS) - aca solo se controla el dinero y el limite de una vez
    // por dia (si no, el reloj de arena, que es la presion central del juego,
    // dejaria de importar)
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
    // tienda: activa el indulto (ver decide()) - un solo indulto activo a la
    // vez, no se puede comprar otro encima del que ya esta activo
    buyInsurance() {
        const cost = __classPrivateFieldGet(this, _Game_economy, "f").tryBuyInsurance(__classPrivateFieldGet(this, _Game_money, "f"));
        if (cost === 0) {
            return false;
        }
        __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - cost, "f");
        return true;
    }
    // usedAlienStamp = el jugador aprobo con el sello AZUL en vez del verde. Es
    // opcional para no romper a quien llame decide(accept) a secas (los tests, y
    // todo el codigo anterior al dia 6).
    // wasRushed = el jugador decidio casi al toque de abrir el pasaporte (ver
    // RUSH_THRESHOLD_MS en main.ts) - senal de que no lo reviso de verdad. Resta
    // dinero aparte, pero NO suma a #errors: es un descuido de procedimiento,
    // distinto de si la decision en si fue correcta o no.
    decide(accept, usedAlienStamp = false, wasRushed = false) {
        const currentDay = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1];
        const visitor = __classPrivateFieldGet(this, _Game_currentVisitor, "f");
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
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") + 2, "f"); // antes 10 - se achico porque ahora, con dia por tiempo, se pueden ver muchos mas visitantes que antes
            __classPrivateFieldSet(this, _Game_dayMoney, __classPrivateFieldGet(this, _Game_dayMoney, "f") + 2, "f");
        }
        else {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - 5, "f");
            __classPrivateFieldSet(this, _Game_dayMoney, __classPrivateFieldGet(this, _Game_dayMoney, "f") - 5, "f");
            // el indulto absorbe este error (no cuenta para los 4 que pierden la
            // partida) pero no devuelve el dinero - no es gratis equivocarse, es
            // que no te cuesta la partida. Se consume, no queda para el proximo error.
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
        __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_visitorGenerator, "f").generate(__classPrivateFieldGet(this, _Game_dayNumber, "f"), __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1]), "f");
    }
    // el dia ya no termina por cantidad de visitantes: lo llama main.ts cuando se
    // acaba el temporizador del dia. Antes vivia adentro de decide(), atado a
    // visitorsSeenToday >= currentDay.getVisitorGoal().
    endDay() {
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_recordDayVisitors).call(this); // antes de tocar #dayNumber: el conteo es del dia que se cierra
        // foto del dia que se cierra, ANTES de que #startDay() (mas abajo) resetee
        // los contadores del dia - ver pantalla de resumen en main.ts
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
    // --- datos para los premios de fin de partida (ver AWARD_BEATS en main.ts) ---
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
    // --- datos del ultimo dia cerrado (ver pantalla de resumen en main.ts) ---
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
    // dias terminados de verdad: al perder en el dia 4 quedan 3 completos, y al ganar
    // #dayNumber ya vale #totalDays + 1, asi que quedan los 7
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
        __classPrivateFieldSet(this, _Game_totalDays, saved.totalDays ?? 7, "f"); // partidas guardadas de antes de este dato: 7 por defecto
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
    __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_visitorGenerator, "f").generate(__classPrivateFieldGet(this, _Game_dayNumber, "f"), __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1]), "f");
    saveCurrentGame({ dayNumber: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), totalDays: __classPrivateFieldGet(this, _Game_totalDays, "f") });
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