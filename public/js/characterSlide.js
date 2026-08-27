// El pasaporte NO usa este mecanismo: viaja en un arco parabolico propio, ver
// bezierArc.ts y su uso en renderVisitor()/resolveDecision() (en main.ts).
const PORTRAIT_REST_LEFT = "49%";
export const CHARACTER_ELEMENT = { selector: "#character-portrait", restLeft: PORTRAIT_REST_LEFT };
const SLIDING_ELEMENTS = [CHARACTER_ELEMENT];
export function resetElementOffscreen(element) {
    const el = document.querySelector(element.selector);
    if (el === null) {
        return;
    }
    el.style.transition = "none";
    el.style.left = "130%";
    void el.offsetWidth; // fuerza el reflow para que el salto instantaneo se registre antes de reactivar la transicion
    el.style.transition = "";
    el.style.left = element.restLeft;
}
// los sellos ya no son <button>: son <div role="button"> arrastrables (ver
// setupStampDrag() en stampDrag.ts), asi que "disabled" no existe como
// propiedad - se simula con aria-disabled + pointer-events:none (ver
// .stamp-drag[aria-disabled] en style.css), un solo lugar para los 4 puntos
// del codigo que antes tocaban acceptBtn.disabled/rejectBtn.disabled directo.
export function setDecisionStampsEnabled(enabled) {
    const acceptBtn = document.querySelector("#accept-btn");
    const rejectBtn = document.querySelector("#reject-btn");
    const alienBtn = document.querySelector("#alien-btn");
    [acceptBtn, rejectBtn, alienBtn].forEach(el => {
        if (el !== null) {
            el.setAttribute("aria-disabled", enabled ? "false" : "true");
        }
    });
}
export function slideOutSlidingElements(direction, animMs, onFinish) {
    setDecisionStampsEnabled(false);
    SLIDING_ELEMENTS.forEach(({ selector }) => {
        const el = document.querySelector(selector);
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
//# sourceMappingURL=characterSlide.js.map