let dialogueIntervalId = null;
export function typeDialogue(text, targetSelector) {
    const dialogueEl = document.querySelector(targetSelector);
    if (dialogueEl === null) {
        return;
    }
    if (dialogueIntervalId !== null) {
        clearInterval(dialogueIntervalId);
    }
    const words = text.split(" ");
    dialogueEl.textContent = "";
    let index = 0;
    dialogueIntervalId = window.setInterval(() => {
        dialogueEl.textContent = words.slice(0, index + 1).join(" ");
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