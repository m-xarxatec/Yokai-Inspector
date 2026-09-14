const EXTRA_TIME_COST = 5;

const INSURANCE_COST = 8;

export class Economy {
    #dayCharge: number;
    #lastDayCharge: number;
    #usedExtraTimeToday: boolean;
    #hasInsurance: boolean;

    constructor() {
        this.#dayCharge = 0;
        this.#lastDayCharge = 0;
        this.#usedExtraTimeToday = false;
        this.#hasInsurance = false;
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

    chargeDailyCost(activeRulesCount: number): number {
        const cost = 2 + activeRulesCount;
        this.#dayCharge = cost;
        return cost;
    }

    consumeInsuranceIfActive(): boolean {
        if (!this.#hasInsurance) {
            return false;
        }
        this.#hasInsurance = false;
        return true;
    }

    tryBuyExtraTime(availableMoney: number): number {
        if (availableMoney < EXTRA_TIME_COST || this.#usedExtraTimeToday) {
            return 0;
        }
        this.#usedExtraTimeToday = true;
        return EXTRA_TIME_COST;
    }

    tryBuyInsurance(availableMoney: number): number {
        if (availableMoney < INSURANCE_COST || this.#hasInsurance) {
            return 0;
        }
        this.#hasInsurance = true;
        return INSURANCE_COST;
    }

    resetForNewDay(): void {
        this.#usedExtraTimeToday = false;
        this.#hasInsurance = false;
    }

    snapshotDayEnd(): void {
        this.#lastDayCharge = this.#dayCharge;
    }
}
