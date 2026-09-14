const NAV_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
function visibleScreen() {
    const screens = Array.from(document.querySelectorAll("section"));
    return screens.find(screen => !screen.classList.contains("hidden")) ?? null;
}
function navButtons(screen) {
    const selector = "button:not([disabled]), [role=\"button\"]:not([aria-disabled=\"true\"])";
    return Array.from(screen.querySelectorAll(selector))
        .filter(element => element.getClientRects().length > 0);
}
export function focusFirstControl(screenId) {
    if (screenId === "game") {
        return;
    }
    const screen = document.querySelector(`#${screenId}-screen`);
    if (screen === null) {
        return;
    }
    window.setTimeout(() => {
        const textInput = screen.querySelector("input[type=\"text\"]");
        if (textInput !== null && textInput.getClientRects().length > 0) {
            textInput.focus();
            return;
        }
        const buttons = navButtons(screen);
        if (buttons.length > 0) {
            buttons[0].focus();
        }
    }, 0);
}
export function initKeyboardNav(getState) {
    document.addEventListener("keydown", (event) => {
        if (getState() === "game") {
            return;
        }
        if (!NAV_KEYS.includes(event.key)) {
            return;
        }
        if (document.activeElement instanceof HTMLInputElement) {
            return;
        }
        const screen = visibleScreen();
        if (screen === null) {
            return;
        }
        const buttons = navButtons(screen);
        if (buttons.length === 0) {
            return;
        }
        event.preventDefault();
        const active = document.activeElement;
        const currentIndex = active instanceof HTMLElement ? buttons.indexOf(active) : -1;
        const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
        let nextIndex;
        if (currentIndex === -1) {
            nextIndex = forward ? 0 : buttons.length - 1;
        }
        else {
            nextIndex = (currentIndex + (forward ? 1 : -1) + buttons.length) % buttons.length;
        }
        buttons[nextIndex].focus();
    });
}
//# sourceMappingURL=keyboardNav.js.map