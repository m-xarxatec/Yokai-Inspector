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
var _Game_instances, _Game_dayNumber, _Game_errors, _Game_money, _Game_maxErrors, _Game_totalDays, _Game_days, _Game_currentVisitor, _Game_visitorsSeenToday, _Game_parts, _Game_names, _Game_phrases, _Game_stamps, _Game_species, _Game_playerName, _Game_startDay, _Game_generateVisitor, _Game_pickPhrase;
import { saveCurrentGame, loadCurrentGame, deleteCurrentGame, saveToHistory, addCredits } from "../Storage.js";
import { Passport } from "./Passport.js";
import { Human } from "./Human.js";
import { Yokai } from "./Yokai.js";
import { Rule } from "./Rule.js";
import { Day } from "./Day.js";
export class Game {
    constructor(playerName = "Jugador") {
        _Game_instances.add(this);
        _Game_dayNumber.set(this, void 0);
        _Game_errors.set(this, void 0);
        _Game_money.set(this, void 0);
        _Game_maxErrors.set(this, void 0);
        _Game_totalDays.set(this, void 0);
        _Game_days.set(this, void 0);
        _Game_currentVisitor.set(this, void 0);
        _Game_visitorsSeenToday.set(this, void 0);
        _Game_parts.set(this, void 0);
        _Game_names.set(this, void 0);
        _Game_phrases.set(this, void 0);
        _Game_stamps.set(this, void 0);
        _Game_species.set(this, void 0);
        _Game_playerName.set(this, void 0);
        __classPrivateFieldSet(this, _Game_playerName, playerName.trim() !== "" ? playerName : "Jugador", "f");
        __classPrivateFieldSet(this, _Game_dayNumber, 1, "f");
        __classPrivateFieldSet(this, _Game_errors, 0, "f");
        __classPrivateFieldSet(this, _Game_money, 10, "f");
        __classPrivateFieldSet(this, _Game_maxErrors, 4, "f");
        __classPrivateFieldSet(this, _Game_totalDays, 7, "f");
        __classPrivateFieldSet(this, _Game_days, [], "f");
        __classPrivateFieldSet(this, _Game_currentVisitor, null, "f");
        __classPrivateFieldSet(this, _Game_visitorsSeenToday, 0, "f");
        __classPrivateFieldSet(this, _Game_names, [], "f");
        __classPrivateFieldSet(this, _Game_phrases, [], "f");
        __classPrivateFieldSet(this, _Game_stamps, [], "f");
        __classPrivateFieldSet(this, _Game_species, [], "f");
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
            __classPrivateFieldSet(this, _Game_parts, parts, "f");
            __classPrivateFieldSet(this, _Game_names, names, "f");
            __classPrivateFieldSet(this, _Game_phrases, phrases, "f");
            __classPrivateFieldSet(this, _Game_stamps, stamps, "f");
            __classPrivateFieldSet(this, _Game_species, species, "f");
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
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") + 2, "f"); // antes 10 - se achico porque ahora, con dia por tiempo, se pueden ver muchos mas visitantes que antes
        }
        else {
            __classPrivateFieldSet(this, _Game_money, __classPrivateFieldGet(this, _Game_money, "f") - 5, "f");
            __classPrivateFieldSet(this, _Game_errors, __classPrivateFieldGet(this, _Game_errors, "f") + 1, "f");
        }
        __classPrivateFieldSet(this, _Game_visitorsSeenToday, __classPrivateFieldGet(this, _Game_visitorsSeenToday, "f") + 1, "f");
        if (this.isLost()) {
            saveToHistory({ day: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), result: "derrota", name: __classPrivateFieldGet(this, _Game_playerName, "f") });
            addCredits(__classPrivateFieldGet(this, _Game_playerName, "f"), __classPrivateFieldGet(this, _Game_money, "f"));
            deleteCurrentGame();
            return;
        }
        __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_instances, "m", _Game_generateVisitor).call(this), "f");
    }
    // el dia ya no termina por cantidad de visitantes: lo llama main.ts cuando se
    // acaba el temporizador del dia. Antes vivia adentro de decide(), atado a
    // visitorsSeenToday >= currentDay.getVisitorGoal().
    endDay() {
        __classPrivateFieldSet(this, _Game_dayNumber, __classPrivateFieldGet(this, _Game_dayNumber, "f") + 1, "f");
        if (this.isWon()) {
            saveToHistory({ day: __classPrivateFieldGet(this, _Game_totalDays, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f"), result: "victoria", name: __classPrivateFieldGet(this, _Game_playerName, "f") });
            addCredits(__classPrivateFieldGet(this, _Game_playerName, "f"), __classPrivateFieldGet(this, _Game_money, "f"));
            deleteCurrentGame();
            return;
        }
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
_Game_dayNumber = new WeakMap(), _Game_errors = new WeakMap(), _Game_money = new WeakMap(), _Game_maxErrors = new WeakMap(), _Game_totalDays = new WeakMap(), _Game_days = new WeakMap(), _Game_currentVisitor = new WeakMap(), _Game_visitorsSeenToday = new WeakMap(), _Game_parts = new WeakMap(), _Game_names = new WeakMap(), _Game_phrases = new WeakMap(), _Game_stamps = new WeakMap(), _Game_species = new WeakMap(), _Game_playerName = new WeakMap(), _Game_instances = new WeakSet(), _Game_startDay = function _Game_startDay() {
    __classPrivateFieldSet(this, _Game_visitorsSeenToday, 0, "f");
    __classPrivateFieldSet(this, _Game_currentVisitor, __classPrivateFieldGet(this, _Game_instances, "m", _Game_generateVisitor).call(this), "f");
    saveCurrentGame({ dayNumber: __classPrivateFieldGet(this, _Game_dayNumber, "f"), errors: __classPrivateFieldGet(this, _Game_errors, "f"), money: __classPrivateFieldGet(this, _Game_money, "f") });
}, _Game_generateVisitor = function _Game_generateVisitor() {
    // el dia ya no tiene una cantidad fija de visitantes (dura por tiempo, no
    // por conteo) - "goal" queda solo como el denominador de la proporcion de
    // problematicos, calibrada por dia; en vez de repartir una cantidad exacta
    // en un array pre-armado, se sortea de nuevo en cada visitante.
    const goal = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1].getVisitorGoal();
    const problematicRatio = Math.min(__classPrivateFieldGet(this, _Game_dayNumber, "f") + 1, goal - 1) / goal;
    const isProblematic = Math.random() < problematicRatio;
    const name = __classPrivateFieldGet(this, _Game_names, "f")[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_names, "f").length)];
    const phrase = __classPrivateFieldGet(this, _Game_instances, "m", _Game_pickPhrase).call(this);
    const face = __classPrivateFieldGet(this, _Game_parts, "f").rostro[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").rostro.length)];
    const eyesShape = __classPrivateFieldGet(this, _Game_parts, "f").ojos[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").ojos.length)];
    const mouth = __classPrivateFieldGet(this, _Game_parts, "f").boca[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").boca.length)];
    const horns = __classPrivateFieldGet(this, _Game_parts, "f").cuernos[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").cuernos.length)];
    const hair = __classPrivateFieldGet(this, _Game_parts, "f").sombrero[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_parts, "f").sombrero.length)];
    const activeRules = __classPrivateFieldGet(this, _Game_days, "f")[__classPrivateFieldGet(this, _Game_dayNumber, "f") - 1].getActiveRules();
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
    if (!isProblematic) {
        const allRegions = ["playa", "ciudad", "rio", "bosque", "montana", "via lactea"];
        const allStamps = __classPrivateFieldGet(this, _Game_stamps, "f").map((stamp) => stamp.color);
        const safeRegions = withoutForbiddenToday(allRegions, "region");
        const safeStamps = withoutForbiddenToday(allStamps, "sello");
        const safeSpecies = withoutForbiddenToday(__classPrivateFieldGet(this, _Game_species, "f"), "especieProhibida");
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
        .map((rule) => rule.getProperty())
        .filter((property, index, properties) => properties.indexOf(property) === index);
    const targetProperty = activeProperties[Math.floor(Math.random() * activeProperties.length)];
    const rulesForProperty = activeRules.filter((rule) => rule.getProperty() === targetProperty);
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
        const especieProhibidaHoy = activeRules.filter((rule) => rule.getProperty() === "especieProhibida").map((rule) => rule.getForbiddenValue());
        const lieOptions = __classPrivateFieldGet(this, _Game_species, "f").filter((specie) => specie !== yokaiType && !especieProhibidaHoy.includes(specie));
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
}, _Game_pickPhrase = function _Game_pickPhrase() {
    return __classPrivateFieldGet(this, _Game_phrases, "f")[Math.floor(Math.random() * __classPrivateFieldGet(this, _Game_phrases, "f").length)];
};
//# sourceMappingURL=Game.js.map