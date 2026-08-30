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
var _Economy_dayCharge, _Economy_lastDayCharge, _Economy_usedExtraTimeToday, _Economy_hasInsurance;
// costo del tiempo extra de la tienda (ver tryBuyExtraTime()) - los segundos
// que suma los pone main.ts (EXTRA_TIME_MS), esta clase solo controla el
// dinero y el limite de una vez por dia
const EXTRA_TIME_COST = 5;
// costo del indulto de la tienda (ver tryBuyInsurance()) - la mas cara de las
// 3, porque puede directamente salvar la partida absorbiendo el 4to error
const INSURANCE_COST = 8;
export class Economy {
    constructor() {
        // cobro diario (gastos fijos) que costo empezar el dia EN CURSO - se fija una
        // sola vez en Game.endDay() al entrar a un dia nuevo (0 el dia 1, que no cobra) y
        // se congela en #lastDayCharge recien cuando ESE dia termina, igual que
        // #dayMoney/#lastDayMoney en Game
        _Economy_dayCharge.set(this, void 0);
        _Economy_lastDayCharge.set(this, void 0);
        // limite de 1 tiempo extra comprado por dia (ver tryBuyExtraTime()) -
        // se resetea en resetForNewDay(), no sobrevive al dia siguiente
        _Economy_usedExtraTimeToday.set(this, void 0);
        // indulto activo (ver tryBuyInsurance() y consumeInsuranceIfActive()) - absorbe el
        // proximo error para que Game no lo sume a #errors, se consume al usarse y
        // tambien se resetea en resetForNewDay() si no se llego a gastar ese dia
        _Economy_hasInsurance.set(this, void 0);
        __classPrivateFieldSet(this, _Economy_dayCharge, 0, "f");
        __classPrivateFieldSet(this, _Economy_lastDayCharge, 0, "f");
        __classPrivateFieldSet(this, _Economy_usedExtraTimeToday, false, "f");
        __classPrivateFieldSet(this, _Economy_hasInsurance, false, "f");
    }
    get extraTimeCost() {
        return EXTRA_TIME_COST;
    }
    get insuranceCost() {
        return INSURANCE_COST;
    }
    get usedExtraTimeToday() {
        return __classPrivateFieldGet(this, _Economy_usedExtraTimeToday, "f");
    }
    get hasInsurance() {
        return __classPrivateFieldGet(this, _Economy_hasInsurance, "f");
    }
    get lastDayCharge() {
        return __classPrivateFieldGet(this, _Economy_lastDayCharge, "f");
    }
    // calcula y guarda el cobro del dia que arranca - escala con la cantidad de
    // reglas activas de ese dia (mas reglas, mas visitantes, mas presion
    // economica). Devuelve el monto para que Game se lo reste a #money (esta
    // clase no toca el dinero de Game directo) - Game.#money puede quedar
    // negativo, eso no termina la partida por si solo (la unica condicion de
    // derrota es Game.isLost()).
    chargeDailyCost(activeRulesCount) {
        const cost = 2 + activeRulesCount;
        __classPrivateFieldSet(this, _Economy_dayCharge, cost, "f");
        return cost;
    }
    // true si habia un indulto activo y lo consume (Game no suma a #errors en
    // ese caso); false si no habia ninguno (Game suma el error normal)
    consumeInsuranceIfActive() {
        if (!__classPrivateFieldGet(this, _Economy_hasInsurance, "f")) {
            return false;
        }
        __classPrivateFieldSet(this, _Economy_hasInsurance, false, "f");
        return true;
    }
    // devuelve el costo a descontar si la compra se pudo hacer, 0 si no
    // (sin dinero o ya comprado hoy) - Game decide si tiene el dinero real
    tryBuyExtraTime(availableMoney) {
        if (availableMoney < EXTRA_TIME_COST || __classPrivateFieldGet(this, _Economy_usedExtraTimeToday, "f")) {
            return 0;
        }
        __classPrivateFieldSet(this, _Economy_usedExtraTimeToday, true, "f");
        return EXTRA_TIME_COST;
    }
    // un solo indulto activo a la vez, no se puede comprar otro encima del
    // que ya esta activo
    tryBuyInsurance(availableMoney) {
        if (availableMoney < INSURANCE_COST || __classPrivateFieldGet(this, _Economy_hasInsurance, "f")) {
            return 0;
        }
        __classPrivateFieldSet(this, _Economy_hasInsurance, true, "f");
        return INSURANCE_COST;
    }
    // llamado desde Game.#startDay()
    resetForNewDay() {
        __classPrivateFieldSet(this, _Economy_usedExtraTimeToday, false, "f");
        __classPrivateFieldSet(this, _Economy_hasInsurance, false, "f");
    }
    // llamado desde Game.endDay(), ANTES de que #startDay() (mas abajo en el
    // mismo endDay()) resetee el dia - ver pantalla de resumen en main.ts
    snapshotDayEnd() {
        __classPrivateFieldSet(this, _Economy_lastDayCharge, __classPrivateFieldGet(this, _Economy_dayCharge, "f"), "f");
    }
}
_Economy_dayCharge = new WeakMap(), _Economy_lastDayCharge = new WeakMap(), _Economy_usedExtraTimeToday = new WeakMap(), _Economy_hasInsurance = new WeakMap();
//# sourceMappingURL=Economy.js.map