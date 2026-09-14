type SlidableElement = { selector: string; restLeft: string };

const PORTRAIT_REST_LEFT = "39%";

export const CHARACTER_ELEMENT: SlidableElement = { selector: "#character-portrait", restLeft: PORTRAIT_REST_LEFT };
const SLIDING_ELEMENTS: SlidableElement[] = [CHARACTER_ELEMENT];

export function resetElementOffscreen(element: SlidableElement): void {
  const el = document.querySelector(element.selector) as HTMLElement | null;
  if (el === null) {
    return;
  }
  el.style.transition = "none";
  el.style.left = "130%";
  void el.offsetWidth;
  el.style.transition = "";
  el.style.left = element.restLeft;
}

export function setDecisionStampsEnabled(enabled: boolean): void {
  const acceptBtn = document.querySelector("#accept-btn") as HTMLElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLElement | null;
  const alienBtn = document.querySelector("#alien-btn") as HTMLElement | null;
  [acceptBtn, rejectBtn, alienBtn].forEach(el => {
    if (el !== null) {
      el.setAttribute("aria-disabled", enabled ? "false" : "true");
    }
  });
}

export function slideOutSlidingElements(direction: "left" | "right", animMs: number, onFinish: () => void): void {
  setDecisionStampsEnabled(false);

  SLIDING_ELEMENTS.forEach(({ selector }) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el === null) {
      return;
    }
    if (direction === "left") {
      el.style.left = "-70%";
    }
    if (direction === "right") {
      el.style.left = "130%";
    }
  });

  window.setTimeout(onFinish, animMs);
}
