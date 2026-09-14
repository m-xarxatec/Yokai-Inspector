import { setDecisionStampsEnabled } from "./characterSlide.js";
const PASSPORT_OPEN_DELAY_MS = 150;
const STAMP_REST_POSITION = {
    "alien-btn": { left: 29, top: 78 },
    "reject-btn": { left: 80, top: 78 },
    "accept-btn": { left: 91, top: 78 },
};
const STAMP_DROP_MARGIN_PX = 60;
function isNearPassport(clientX, clientY) {
    const passportEl = document.querySelector("#passport-object");
    if (passportEl === null || !passportEl.classList.contains("open")) {
        return false;
    }
    const rect = passportEl.getBoundingClientRect();
    return (clientX >= rect.left - STAMP_DROP_MARGIN_PX &&
        clientX <= rect.right + STAMP_DROP_MARGIN_PX &&
        clientY >= rect.top - STAMP_DROP_MARGIN_PX &&
        clientY <= rect.bottom + STAMP_DROP_MARGIN_PX);
}
function setupStampDrag(id, accept, usedAlienStamp, soundManager, resolveDecision) {
    const stampEl = document.querySelector("#" + id);
    const sceneEl = document.querySelector("#character-scene");
    const rest = STAMP_REST_POSITION[id];
    if (stampEl === null || sceneEl === null || rest === undefined) {
        return;
    }
    function returnToRest() {
        if (stampEl === null)
            return;
        stampEl.classList.remove("dragging", "pos2", "pos3");
        stampEl.classList.add("pos1");
        stampEl.style.left = rest.left + "%";
        stampEl.style.top = rest.top + "%";
        stampEl.style.height = "";
    }
    function move(clientX, clientY) {
        if (stampEl === null || sceneEl === null)
            return;
        const sceneRect = sceneEl.getBoundingClientRect();
        const left = ((clientX - sceneRect.left) / sceneRect.width) * 100;
        const top = ((clientY - sceneRect.top) / sceneRect.height) * 100;
        stampEl.style.left = Math.min(Math.max(left, 2), 98) + "%";
        stampEl.style.top = Math.min(Math.max(top, 2), 98) + "%";
        stampEl.classList.remove("pos2", "pos3");
        stampEl.classList.add(isNearPassport(clientX, clientY) ? "pos3" : "pos2");
    }
    stampEl.addEventListener("pointerdown", (event) => {
        if (stampEl.getAttribute("aria-disabled") === "true") {
            return;
        }
        stampEl.setPointerCapture(event.pointerId);
        stampEl.classList.add("dragging");
        move(event.clientX, event.clientY);
    });
    stampEl.addEventListener("pointermove", (event) => {
        if (!stampEl.classList.contains("dragging")) {
            return;
        }
        move(event.clientX, event.clientY);
    });
    stampEl.addEventListener("pointerup", (event) => {
        if (!stampEl.classList.contains("dragging")) {
            return;
        }
        const droppedNearPassport = isNearPassport(event.clientX, event.clientY);
        returnToRest();
        if (droppedNearPassport) {
            accept ? soundManager.playAccept() : soundManager.playReject();
            resolveDecision(accept, usedAlienStamp);
        }
    });
    stampEl.addEventListener("keydown", (event) => {
        if (stampEl.getAttribute("aria-disabled") === "true") {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            resolveDecision(accept, usedAlienStamp);
        }
    });
}
export function initStampDrag(soundManager, resolveDecision) {
    setupStampDrag("reject-btn", false, false, soundManager, resolveDecision);
    setupStampDrag("accept-btn", true, false, soundManager, resolveDecision);
    setupStampDrag("alien-btn", true, true, soundManager, resolveDecision);
    document.querySelector("#passport-object")?.addEventListener("click", () => {
        const passportEl = document.querySelector("#passport-object");
        if (passportEl === null) {
            return;
        }
        if (!passportEl.classList.contains("closed") || !passportEl.classList.contains("delivered")) {
            return;
        }
        soundManager.playPaperFlip();
        passportEl.classList.remove("delivered");
        window.setTimeout(() => {
            passportEl.classList.remove("closed");
            passportEl.classList.add("open");
            setDecisionStampsEnabled(true);
        }, PASSPORT_OPEN_DELAY_MS);
    });
}
//# sourceMappingURL=stampDrag.js.map