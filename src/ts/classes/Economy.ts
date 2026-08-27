// penalizacion por decidir sin revisar el pasaporte (ver Game.decide(),
// parametro wasRushed) - chica a proposito, es un descuido, no un error de reglas
const RUSH_PENALTY = 1;

// costo de la pista de la tienda (ver Game.buyHint()) - la mas barata de las 3
// compras, porque no garantiza nada si el visitante esta limpio
const HINT_COST = 3;

// costo del tiempo extra de la tienda (ver tryBuyExtraTime()) - los segundos
// que suma los pone main.ts (EXTRA_TIME_MS), esta clase solo controla el
// dinero y el limite de una vez por dia
const EXTRA_TIME_COST = 5;

// costo del indulto de la tienda (ver tryBuyInsurance()) - la mas cara de las
// 3, porque puede directamente salvar la partida absorbiendo el 4to error
const INSURANCE_COST = 8;

export class Economy {
    // cobro diario (gastos fijos) que costo empezar el dia EN CURSO - se fija una
    // sola vez en Game.endDay() al entrar a un dia nuevo (0 el dia 1, que no cobra) y
    // se congela en #lastDayCharge recien cuando ESE dia termina, igual que
    // #dayMoney/#lastDayMoney en Game
    #dayCharge: number;
    #lastDayCharge: number;
    // penalizacion de "decidiste sin revisar" (ver Game.decide(), parametro wasRushed) -
    // NO suma a #errors, es un descuido de procedimiento aparte de si la decision
    // en si fue correcta o no. Mismo patron dia/lastDay que #dayCharge.
    #dayRushPenalty: number;
    #lastDayRushPenalty: number;
    // limite de 1 tiempo extra comprado por dia (ver tryBuyExtraTime()) -
    // se resetea en resetForNewDay(), no sobrevive al dia siguiente
    #usedExtraTimeToday: boolean;
    // indulto activo (ver tryBuyInsurance() y consumeInsuranceIfActive()) - absorbe el
    // proximo error para que Game no lo sume a #errors, se consume al usarse y
    // tambien se resetea en resetForNewDay() si no se llego a gastar ese dia
    #hasInsurance: boolean;

    constructor() {
        this.#dayCharge = 0;
        this.#lastDayCharge = 0;
        this.#dayRushPenalty = 0;
        this.#lastDayRushPenalty = 0;
        this.#usedExtraTimeToday = false;
        this.#hasInsurance = false;
    }

    get hintCost(): number {
        return HINT_COST;
    }
    get extraTimeCost(): number {
        return EXTRA_TIME_COST;
    }
    get insuranceCost(): number {
        return INSURANCE_COST;
    }
    get usedExtraTimeToday(): boolean {
        return this.#usedExtraTimeToday;
    }
    get hasInsurance(): boolean {
        return this.#hasInsurance;
    }
    get lastDayCharge(): number {
        return this.#lastDayCharge;
    }
    get lastDayRushPenalty(): number {
        return this.#lastDayRushPenalty;
    }

    // calcula y guarda el cobro del dia que arranca - escala con la cantidad de
    // reglas activas de ese dia (mas reglas, mas visitantes, mas presion
    // economica). Devuelve el monto para que Game se lo reste a #money (esta
    // clase no toca el dinero de Game directo) - Game.#money puede quedar
    // negativo, eso no termina la partida por si solo (la unica condicion de
    // derrota es Game.isLost()).
    chargeDailyCost(activeRulesCount: number): number {
        const cost = 2 + activeRulesCount;
        this.#dayCharge = cost;
        return cost;
    }

    // devuelve el monto de la penalizacion y lo registra - Game decide si
    // corresponde llamarlo (wasRushed) y le resta el resultado a #money
    recordRushPenalty(): number {
        this.#dayRushPenalty += RUSH_PENALTY;
        return RUSH_PENALTY;
    }

    // true si habia un indulto activo y lo consume (Game no suma a #errors en
    // ese caso); false si no habia ninguno (Game suma el error normal)
    consumeInsuranceIfActive(): boolean {
        if (!this.#hasInsurance) {
            return false;
        }
        this.#hasInsurance = false;
        return true;
    }

    // devuelve el costo a descontar si la compra se pudo hacer, 0 si no
    // (sin dinero o ya comprado hoy) - Game decide si tiene el dinero real
    tryBuyExtraTime(availableMoney: number): number {
        if (availableMoney < EXTRA_TIME_COST || this.#usedExtraTimeToday) {
            return 0;
        }
        this.#usedExtraTimeToday = true;
        return EXTRA_TIME_COST;
    }

    // un solo indulto activo a la vez, no se puede comprar otro encima del
    // que ya esta activo
    tryBuyInsurance(availableMoney: number): number {
        if (availableMoney < INSURANCE_COST || this.#hasInsurance) {
            return 0;
        }
        this.#hasInsurance = true;
        return INSURANCE_COST;
    }

    // llamado desde Game.#startDay()
    resetForNewDay(): void {
        this.#dayRushPenalty = 0;
        this.#usedExtraTimeToday = false;
        this.#hasInsurance = false;
    }

    // llamado desde Game.endDay(), ANTES de que #startDay() (mas abajo en el
    // mismo endDay()) resetee el dia - ver pantalla de resumen en main.ts
    snapshotDayEnd(): void {
        this.#lastDayCharge = this.#dayCharge;
        this.#lastDayRushPenalty = this.#dayRushPenalty;
    }
}
