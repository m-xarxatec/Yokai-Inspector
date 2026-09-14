export function createCubicBezierEasing(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  function onAxis(a1: number, a2: number, t: number): number {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * t * a1 + 3 * oneMinusT * t * t * a2 + t * t * t;
  }

  function derivativeOnAxis(a1: number, a2: number, t: number): number {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * a1 + 6 * oneMinusT * t * (a2 - a1) + 3 * t * t * (1 - a2);
  }

  return function easing(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const slope = derivativeOnAxis(x1, x2, t);
      if (Math.abs(slope) > 0.000001) {
        t = t - (onAxis(x1, x2, t) - x) / slope;
      }
    }
    return onAxis(y1, y2, t);
  };
}

export type PassportPoint = { left: number; top: number; height: number };
export type ControlPoint = { left: number; top: number };

const PASSPORT_ARC_FRONT_THRESHOLD = 0.7;
const PASSPORT_BEHIND_Z_INDEX = "2";

export function animatePassportAlongArc(
  from: PassportPoint,
  control: ControlPoint,
  to: PassportPoint,
  durationMs: number,
  easing: (t: number) => number,
  endsAtDesk: boolean,
  onFinish: () => void
): void {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null) {
    onFinish();
    return;
  }
  const el: HTMLElement = passportEl;

  el.style.transition = "none";
  el.style.zIndex = endsAtDesk ? PASSPORT_BEHIND_Z_INDEX : "";
  const startTime = performance.now();

  let minTopSeen = from.top;
  let pastPeak = false;

  function step(now: number): void {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const t = easing(progress);
    const oneMinusT = 1 - t;

    const left = oneMinusT * oneMinusT * from.left + 2 * oneMinusT * t * control.left + t * t * to.left;
    const top = oneMinusT * oneMinusT * from.top + 2 * oneMinusT * t * control.top + t * t * to.top;
    const height = from.height + (to.height - from.height) * t;

    el.style.left = left + "%";
    el.style.top = top + "%";
    el.style.height = height + "%";

    let inFront: boolean;
    if (endsAtDesk) {
      if (top > minTopSeen) {
        pastPeak = true;
      } else {
        minTopSeen = top;
      }
      inFront = pastPeak;
    } else {
      const approachingDesk = 1 - progress;
      inFront = approachingDesk >= PASSPORT_ARC_FRONT_THRESHOLD;
    }

    if (inFront) {
      el.style.zIndex = "";
    } else {
      el.style.zIndex = PASSPORT_BEHIND_Z_INDEX;
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      onFinish();
    }
  }

  window.requestAnimationFrame(step);
}
