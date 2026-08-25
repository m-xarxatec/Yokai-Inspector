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
  #dayTimeoutId: number | null = null;
  #clockIntervalId: number | null = null;
  #dayElapsedMs = 0;
  #dayResumedAt: number | null = null;
  #durationMs = 0;

  // si el temporizador del dia vence justo mientras se esta animando una
  // decision (resolveDecision() en main.ts - tarda ~2s en total: sello,
  // cierre, arco de vuelta, salida del personaje), no hay que cortarla a la
  // mitad: eso generaba dos caminos llegando a afterDecision() casi juntos
  // (el del timer y el de la decision en curso), cada uno eligiendo una Jefa
  // al azar - por eso se veia "cambiar de golpe" en la pantalla de resultado
  // del dia. En vez de eso, se marca que el dia debe cerrarse, y se cierra
  // recien cuando esa decision termina de procesar (ver releaseResolving()).
  #resolvingDecision = false;
  #dayEndsOnRelease = false;

  #onExpire: () => void;

  constructor(onExpire: () => void) {
    this.#onExpire = onExpire;
  }

  #currentElapsedMs(): number {
    if (this.#dayResumedAt === null) {
      return this.#dayElapsedMs;
    }
    return this.#dayElapsedMs + (performance.now() - this.#dayResumedAt);
  }

  // solo detiene el intervalo visual (deja el reloj congelado en su ultimo
  // cuadro) - no toca dayElapsedMs/dayResumedAt, eso lo maneja quien pause/pare
  // el dia de verdad (pause()/clear())
  #stopClock(): void {
    if (this.#clockIntervalId !== null) {
      window.clearInterval(this.#clockIntervalId);
      this.#clockIntervalId = null;
    }
  }

  #startClock(): void {
    this.#stopClock();
    this.#updateClock();
    this.#clockIntervalId = window.setInterval(() => this.#updateClock(), CLOCK_TICK_MS);
  }

  // 4 etapas (full/medio/casi/vacio) repartidas en partes iguales del tiempo
  // del dia, cada una alternando entre sus 2 cuadros para dar sensacion de
  // movimiento; al quedar <=3s (o vencer) pasa a "broken".
  #updateClock(): void {
    const clockEl = document.querySelector("#day-clock") as HTMLElement | null;
    if (clockEl === null) {
      return;
    }

    const elapsed = this.#currentElapsedMs();
    const remaining = Math.max(this.#durationMs - elapsed, 0);
    const dayQuarter = this.#durationMs / 4;

    const frame = Math.floor(elapsed / CLOCK_FRAME_MS) % 2 === 0 ? "frame-a" : "frame-b";

    let stage: string;
    if (remaining <= CLOCK_BROKEN_THRESHOLD_MS) {
      stage = "broken";
    } else if (remaining <= dayQuarter) {
      stage = "stage-empty";
    } else if (remaining <= dayQuarter * 2) {
      stage = "stage-almost";
    } else if (remaining <= dayQuarter * 3) {
      stage = "stage-half";
    } else {
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
      if (this.#resolvingDecision) {
        clockEl.classList.add("pulse-strong");
      }
    } else if (stage === "stage-empty" || (stage === "stage-almost" && remaining <= dayQuarter * 2.5)) {
      clockEl.classList.add("pulse-light");
    }
  }

  #handleExpire(): void {
    if (this.#resolvingDecision) {
      this.#dayEndsOnRelease = true;
      return;
    }
    this.#onExpire();
  }

  clear(): void {
    if (this.#dayTimeoutId !== null) {
      clearTimeout(this.#dayTimeoutId);
      this.#dayTimeoutId = null;
    }
    this.#stopClock();
    this.#dayElapsedMs = 0;
    this.#dayResumedAt = null;
  }

  // arranca una sola vez por dia (no por visitante) - mientras corre, los
  // visitantes se suceden sin reiniciarlo. Al vencer, termina el dia entero,
  // haya o no un visitante a medio decidir en pantalla.
  start(durationMs: number, timerEnabled: boolean): void {
    this.clear();
    this.#durationMs = durationMs;

    const clockEl = document.querySelector("#day-clock") as HTMLElement | null;
    if (!timerEnabled) {
      if (clockEl !== null) {
        clockEl.classList.add("hidden");
      }
      return;
    }
    if (clockEl !== null) {
      clockEl.classList.remove("hidden");
    }

    this.#dayResumedAt = performance.now();
    this.#startClock();
    this.#dayTimeoutId = window.setTimeout(() => this.#handleExpire(), durationMs);
  }

  // pausa el dia entero (temporizador + reloj visual, que queda congelado en
  // su ultimo cuadro) sin perder el tiempo ya transcurrido - usada mientras
  // se muestra una pantalla de reaccion de la Jefa por error o la tienda.
  pause(): void {
    if (this.#dayResumedAt === null) {
      return; // ya estaba pausado (o el dia nunca arranco), nada que hacer
    }
    if (this.#dayTimeoutId !== null) {
      clearTimeout(this.#dayTimeoutId);
      this.#dayTimeoutId = null;
    }
    this.#dayElapsedMs = this.#currentElapsedMs();
    this.#dayResumedAt = null;
    this.#stopClock();
  }

  // reanuda un dia pausado con pause() - re-programa el cierre del dia con
  // el tiempo REAL que queda (no el dia entero de nuevo)
  resume(timerEnabled: boolean): void {
    if (!timerEnabled || this.#dayResumedAt !== null) {
      return;
    }
    this.#dayResumedAt = performance.now();
    this.#startClock();
    const remainingMs = Math.max(this.#durationMs - this.#dayElapsedMs, 0);
    this.#dayTimeoutId = window.setTimeout(() => this.#handleExpire(), remainingMs);
  }

  // usada por la compra de tiempo extra en la tienda: restar del tiempo ya
  // transcurrido equivale a sumarle tiempo al reloj
  addExtraTime(ms: number): void {
    this.#dayElapsedMs = Math.max(this.#dayElapsedMs - ms, 0);
    this.#updateClock();
  }

  markResolving(): void {
    this.#resolvingDecision = true;
  }

  // corta el flag de "decision en curso" y devuelve si el dia habia vencido
  // mientras tanto - el llamador decide que hacer con eso (ver resolveDecision()
  // en main.ts)
  releaseResolving(): boolean {
    this.#resolvingDecision = false;
    const dayEnded = this.#dayEndsOnRelease;
    this.#dayEndsOnRelease = false;
    return dayEnded;
  }
}
