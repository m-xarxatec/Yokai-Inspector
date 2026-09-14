const CLOCK_FRAME_MS = 450;
const CLOCK_TICK_MS = 200;
const CLOCK_BROKEN_THRESHOLD_MS = 3000;

export class DayTimer {
  #dayTimeoutId: number | null = null;
  #clockIntervalId: number | null = null;
  #dayElapsedMs = 0;
  #dayResumedAt: number | null = null;
  #durationMs = 0;

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

  pause(): void {
    if (this.#dayResumedAt === null) {
      return;
    }
    if (this.#dayTimeoutId !== null) {
      clearTimeout(this.#dayTimeoutId);
      this.#dayTimeoutId = null;
    }
    this.#dayElapsedMs = this.#currentElapsedMs();
    this.#dayResumedAt = null;
    this.#stopClock();
  }

  resume(timerEnabled: boolean): void {
    if (!timerEnabled || this.#dayResumedAt !== null) {
      return;
    }
    this.#dayResumedAt = performance.now();
    this.#startClock();
    const remainingMs = Math.max(this.#durationMs - this.#dayElapsedMs, 0);
    this.#dayTimeoutId = window.setTimeout(() => this.#handleExpire(), remainingMs);
  }

  addExtraTime(ms: number): void {
    this.#dayElapsedMs = Math.max(this.#dayElapsedMs - ms, 0);
    this.#updateClock();
  }

  markResolving(): void {
    this.#resolvingDecision = true;
  }

  releaseResolving(): boolean {
    this.#resolvingDecision = false;
    const dayEnded = this.#dayEndsOnRelease;
    this.#dayEndsOnRelease = false;
    return dayEnded;
  }
}
