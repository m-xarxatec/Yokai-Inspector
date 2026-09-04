// --- navegacion con teclado entre los botones de las pantallas ---
//
// Las flechas mueven el foco entre los controles (botones) de la pantalla
// visible; Enter/Espacio ya los activan solos por ser <button> nativos, no
// hace falta un handler propio. Esto NO aplica a la pantalla de juego
// (#game-screen): ahi los sellos son drag and drop con el mouse (ver
// stampDrag.ts), el teclado no participa.
const NAV_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
function visibleScreen() {
    const screens = Array.from(document.querySelectorAll("section"));
    return screens.find(screen => !screen.classList.contains("hidden")) ?? null;
}
// botones (y elementos con role="button") de una pantalla que estan realmente
// a la vista y habilitados - getClientRects() vacio = oculto (pantalla hidden,
// display none, etc.)
function navButtons(screen) {
    const selector = "button:not([disabled]), [role=\"button\"]:not([aria-disabled=\"true\"])";
    return Array.from(screen.querySelectorAll(selector))
        .filter(element => element.getClientRects().length > 0);
}
// foco inicial al entrar a una pantalla: el input de texto si lo hay (ej. el
// nombre del inspector), y si no el primer boton disponible. La pantalla de
// juego se saltea a proposito.
export function focusFirstControl(screenId) {
    if (screenId === "game") {
        return;
    }
    const screen = document.querySelector(`#${screenId}-screen`);
    if (screen === null) {
        return;
    }
    // en un setTimeout(0) para correr despues de que changeState() termino de
    // quitar/poner .hidden en las secciones (si no, la pantalla todavia figura
    // oculta y getClientRects() da vacio)
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
        // dentro de un input (texto o slider) las flechas son para mover el cursor
        // o ajustar el valor, no para cambiar de boton
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