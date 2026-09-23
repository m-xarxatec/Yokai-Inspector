let dialogueIntervalId = null;
export function typeDialogue(text, targetSelector) {
    const dialogueEl = document.querySelector(targetSelector);
    if (dialogueEl === null) {
        return;
    }
    if (dialogueIntervalId !== null) {
        clearInterval(dialogueIntervalId);
    }
    const ghost = document.createElement("span");
    ghost.className = "dialogue-ghost";
    ghost.textContent = text;
    const live = document.createElement("span");
    live.className = "dialogue-live";
    dialogueEl.replaceChildren(ghost, live);
    const words = text.split(" ");
    let index = 0;
    dialogueIntervalId = window.setInterval(() => {
        live.textContent = words.slice(0, index + 1).join(" ");
        index += 1;
        if (index >= words.length) {
            if (dialogueIntervalId !== null) {
                clearInterval(dialogueIntervalId);
            }
            dialogueIntervalId = null;
        }
    }, 160);
}
export function stopDialogue() {
    if (dialogueIntervalId !== null) {
        clearInterval(dialogueIntervalId);
        dialogueIntervalId = null;
    }
}
//# sourceMappingURL=dialogue.js.map