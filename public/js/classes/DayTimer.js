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
var _DayTimer_instances, _DayTimer_dayTimeoutId, _DayTimer_clockIntervalId, _DayTimer_dayElapsedMs, _DayTimer_dayResumedAt, _DayTimer_durationMs, _DayTimer_resolvingDecision, _DayTimer_dayEndsOnRelease, _DayTimer_onExpire, _DayTimer_currentElapsedMs, _DayTimer_stopClock, _DayTimer_startClock, _DayTimer_updateClock, _DayTimer_handleExpire;
// duracion de cada cuadro/tick del reloj de arena visual del dia (mismos
// valores que tenia main.ts) - ver #updateClock()
const CLOCK_FRAME_MS = 450;
const CLOCK_TICK_MS = 200;
const CLOCK_BROKEN_THRESHOLD_MS = 3000;
// temporizador del dia entero (no por visitante) + el reloj de arena visual
// que lo representa en pantalla (#day-clock). onExpire se llama cuando el
// dia vence de verdad - ver #handleExpire(), que puede diferir ese aviso si
// hay una decision en curso (ver markResolving()/releaseResolving()).
export class DayTimer {
    constructor(onExpire) {
        _DayTimer_instances.add(this);
        _DayTimer_dayTimeoutId.set(this, null);
        _DayTimer_clockIntervalId.set(this, null);
        _DayTimer_dayElapsedMs.set(this, 0);
        _DayTimer_dayResumedAt.set(this, null);
        _DayTimer_durationMs.set(this, 0);
        // si el temporizador del dia vence justo mientras se esta animando una
        // decision (resolveDecision() en main.ts - tarda ~2s en total: sello,
        // cierre, arco de vuelta, salida del personaje), no hay que cortarla a la
        // mitad: eso generaba dos caminos llegando a afterDecision() casi juntos
        // (el del timer y el de la decision en curso), cada uno eligiendo una Jefa
        // al azar - por eso se veia "cambiar de golpe" en la pantalla de resultado
        // del dia. En vez de eso, se marca que el dia debe cerrarse, y se cierra
        // recien cuando esa decision termina de procesar (ver releaseResolving()).
        _DayTimer_resolvingDecision.set(this, false);
        _DayTimer_dayEndsOnRelease.set(this, false);
        _DayTimer_onExpire.set(this, void 0);
        __classPrivateFieldSet(this, _DayTimer_onExpire, onExpire, "f");
    }
    clear() {
        if (__classPrivateFieldGet(this, _DayTimer_dayTimeoutId, "f") !== null) {
            clearTimeout(__classPrivateFieldGet(this, _DayTimer_dayTimeoutId, "f"));
            __classPrivateFieldSet(this, _DayTimer_dayTimeoutId, null, "f");
        }
        __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_stopClock).call(this);
        __classPrivateFieldSet(this, _DayTimer_dayElapsedMs, 0, "f");
        __classPrivateFieldSet(this, _DayTimer_dayResumedAt, null, "f");
    }
    // arranca una sola vez por dia (no por visitante) - mientras corre, los
    // visitantes se suceden sin reiniciarlo. Al vencer, termina el dia entero,
    // haya o no un visitante a medio decidir en pantalla.
    start(durationMs, timerEnabled) {
        this.clear();
        __classPrivateFieldSet(this, _DayTimer_durationMs, durationMs, "f");
        const clockEl = document.querySelector("#day-clock");
        if (!timerEnabled) {
            if (clockEl !== null) {
                clockEl.classList.add("hidden");
            }
            return;
        }
        if (clockEl !== null) {
            clockEl.classList.remove("hidden");
        }
        __classPrivateFieldSet(this, _DayTimer_dayResumedAt, performance.now(), "f");
        __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_startClock).call(this);
        __classPrivateFieldSet(this, _DayTimer_dayTimeoutId, window.setTimeout(() => __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_handleExpire).call(this), durationMs), "f");
    }
    // pausa el dia entero (temporizador + reloj visual, que queda congelado en
    // su ultimo cuadro) sin perder el tiempo ya transcurrido - usada mientras
    // se muestra una pantalla de reaccion de la Jefa por error o la tienda.
    pause() {
        if (__classPrivateFieldGet(this, _DayTimer_dayResumedAt, "f") === null) {
            return; // ya estaba pausado (o el dia nunca arranco), nada que hacer
        }
        if (__classPrivateFieldGet(this, _DayTimer_dayTimeoutId, "f") !== null) {
            clearTimeout(__classPrivateFieldGet(this, _DayTimer_dayTimeoutId, "f"));
            __classPrivateFieldSet(this, _DayTimer_dayTimeoutId, null, "f");
        }
        __classPrivateFieldSet(this, _DayTimer_dayElapsedMs, __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_currentElapsedMs).call(this), "f");
        __classPrivateFieldSet(this, _DayTimer_dayResumedAt, null, "f");
        __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_stopClock).call(this);
    }
    // reanuda un dia pausado con pause() - re-programa el cierre del dia con
    // el tiempo REAL que queda (no el dia entero de nuevo)
    resume(timerEnabled) {
        if (!timerEnabled || __classPrivateFieldGet(this, _DayTimer_dayResumedAt, "f") !== null) {
            return;
        }
        __classPrivateFieldSet(this, _DayTimer_dayResumedAt, performance.now(), "f");
        __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_startClock).call(this);
        const remainingMs = Math.max(__classPrivateFieldGet(this, _DayTimer_durationMs, "f") - __classPrivateFieldGet(this, _DayTimer_dayElapsedMs, "f"), 0);
        __classPrivateFieldSet(this, _DayTimer_dayTimeoutId, window.setTimeout(() => __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_handleExpire).call(this), remainingMs), "f");
    }
    // usada por la compra de tiempo extra en la tienda: restar del tiempo ya
    // transcurrido equivale a sumarle tiempo al reloj
    addExtraTime(ms) {
        __classPrivateFieldSet(this, _DayTimer_dayElapsedMs, Math.max(__classPrivateFieldGet(this, _DayTimer_dayElapsedMs, "f") - ms, 0), "f");
        __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_updateClock).call(this);
    }
    markResolving() {
        __classPrivateFieldSet(this, _DayTimer_resolvingDecision, true, "f");
    }
    // corta el flag de "decision en curso" y devuelve si el dia habia vencido
    // mientras tanto - el llamador decide que hacer con eso (ver resolveDecision()
    // en main.ts)
    releaseResolving() {
        __classPrivateFieldSet(this, _DayTimer_resolvingDecision, false, "f");
        const dayEnded = __classPrivateFieldGet(this, _DayTimer_dayEndsOnRelease, "f");
        __classPrivateFieldSet(this, _DayTimer_dayEndsOnRelease, false, "f");
        return dayEnded;
    }
}
_DayTimer_dayTimeoutId = new WeakMap(), _DayTimer_clockIntervalId = new WeakMap(), _DayTimer_dayElapsedMs = new WeakMap(), _DayTimer_dayResumedAt = new WeakMap(), _DayTimer_durationMs = new WeakMap(), _DayTimer_resolvingDecision = new WeakMap(), _DayTimer_dayEndsOnRelease = new WeakMap(), _DayTimer_onExpire = new WeakMap(), _DayTimer_instances = new WeakSet(), _DayTimer_currentElapsedMs = function _DayTimer_currentElapsedMs() {
    if (__classPrivateFieldGet(this, _DayTimer_dayResumedAt, "f") === null) {
        return __classPrivateFieldGet(this, _DayTimer_dayElapsedMs, "f");
    }
    return __classPrivateFieldGet(this, _DayTimer_dayElapsedMs, "f") + (performance.now() - __classPrivateFieldGet(this, _DayTimer_dayResumedAt, "f"));
}, _DayTimer_stopClock = function _DayTimer_stopClock() {
    if (__classPrivateFieldGet(this, _DayTimer_clockIntervalId, "f") !== null) {
        window.clearInterval(__classPrivateFieldGet(this, _DayTimer_clockIntervalId, "f"));
        __classPrivateFieldSet(this, _DayTimer_clockIntervalId, null, "f");
    }
}, _DayTimer_startClock = function _DayTimer_startClock() {
    __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_stopClock).call(this);
    __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_updateClock).call(this);
    __classPrivateFieldSet(this, _DayTimer_clockIntervalId, window.setInterval(() => __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_updateClock).call(this), CLOCK_TICK_MS), "f");
}, _DayTimer_updateClock = function _DayTimer_updateClock() {
    const clockEl = document.querySelector("#day-clock");
    if (clockEl === null) {
        return;
    }
    const elapsed = __classPrivateFieldGet(this, _DayTimer_instances, "m", _DayTimer_currentElapsedMs).call(this);
    const remaining = Math.max(__classPrivateFieldGet(this, _DayTimer_durationMs, "f") - elapsed, 0);
    const dayQuarter = __classPrivateFieldGet(this, _DayTimer_durationMs, "f") / 4;
    const frame = Math.floor(elapsed / CLOCK_FRAME_MS) % 2 === 0 ? "frame-a" : "frame-b";
    let stage;
    if (remaining <= CLOCK_BROKEN_THRESHOLD_MS) {
        stage = "broken";
    }
    else if (remaining <= dayQuarter) {
        stage = "stage-empty";
    }
    else if (remaining <= dayQuarter * 2) {
        stage = "stage-almost";
    }
    else if (remaining <= dayQuarter * 3) {
        stage = "stage-half";
    }
    else {
        stage = "stage-full";
    }
    clockEl.classList.remove("stage-full", "stage-half", "stage-almost", "stage-empty", "broken", "frame-a", "frame-b", "pulse-light", "pulse-strong");
    clockEl.classList.add(stage);
    if (stage !== "broken") {
        clockEl.classList.add(frame);
    }
    // parpadeo leve desde la segunda mitad de "casi" en adelante, fuerte recien
    // con el reloj roto y una decision todavia en curso (ver resolvingDecision) -
    // efecto chico a proposito, no debe interrumpir la pantalla
    if (stage === "broken") {
        if (__classPrivateFieldGet(this, _DayTimer_resolvingDecision, "f")) {
            clockEl.classList.add("pulse-strong");
        }
    }
    else if (stage === "stage-empty" || (stage === "stage-almost" && remaining <= dayQuarter * 2.5)) {
        clockEl.classList.add("pulse-light");
    }
}, _DayTimer_handleExpire = function _DayTimer_handleExpire() {
    if (__classPrivateFieldGet(this, _DayTimer_resolvingDecision, "f")) {
        __classPrivateFieldSet(this, _DayTimer_dayEndsOnRelease, true, "f");
        return;
    }
    __classPrivateFieldGet(this, _DayTimer_onExpire, "f").call(this);
};
//# sourceMappingURL=DayTimer.js.map