const HINT_HIGHLIGHT_MS = 2500;
const EXTRA_TIME_MS = 15000;
// traduce la propiedad de la regla violada (ver Rule.getProperty()) al elemento
// que hay que resaltar - los rasgos fisicos (cuernos/ojos amarillos) se ven en
// el personaje, no en el pasaporte. "selloAlien" no entra: nunca es la regla
// violada que devuelve evaluateCharacter() (ver Rule.isViolated()).
function hintTargetSelector(property) {
    if (property === "tieneCuernos") {
        return ".part-horns";
    }
    if (property === "ojosAmarillos") {
        return ".part-eyes";
    }
    if (property === "region") {
        return "#passport-region";
    }
    if (property === "especieProhibida") {
        return "#passport-species";
    }
    if (property === "sello") {
        return "#passport-stamp";
    }
    return null;
}
// registra los listeners de la tienda - getGame()/getTimerEnabled() se llaman
// en cada evento (no una sola vez al iniciar) porque esos valores cambian con
// el tiempo (nueva partida, toggle de opciones), no con la carga del modulo.
export function initShop(getGame, getTimerEnabled, soundManager, dayTimer, changeState) {
    // refresca el dinero mostrado y deshabilita los botones de compra que ya no
    // se pueden pagar - se llama al abrir la tienda y despues de cada compra
    function updateShopScreen() {
        const game = getGame();
        if (game === null) {
            return;
        }
        const moneyEl = document.querySelector("#shop-money");
        if (moneyEl !== null) {
            moneyEl.textContent = String(game.money);
        }
        const hintBtn = document.querySelector("#shop-hint-btn");
        if (hintBtn !== null) {
            hintBtn.disabled = game.money < game.hintCost;
        }
        const extraTimeBtn = document.querySelector("#shop-extra-time-btn");
        if (extraTimeBtn !== null) {
            extraTimeBtn.disabled = game.money < game.extraTimeCost || game.usedExtraTimeToday;
        }
        const insuranceBtn = document.querySelector("#shop-insurance-btn");
        if (insuranceBtn !== null) {
            insuranceBtn.disabled = game.hasInsurance || game.money < game.insuranceCost;
            insuranceBtn.textContent = game.hasInsurance ? "Indulto activo" : "Indulto (-8)";
        }
    }
    document.querySelector("#shop-btn")?.addEventListener("click", () => {
        soundManager.playNextButton(); // sonido de click del boton
        dayTimer.pause();
        updateShopScreen();
        changeState("shop");
    });
    document.querySelector("#shop-continue-btn")?.addEventListener("click", () => {
        soundManager.playNextButton(); // sonido de click del boton
        changeState("game");
        dayTimer.resume(getTimerEnabled());
    });
    document.querySelector("#shop-hint-btn")?.addEventListener("click", () => {
        const game = getGame();
        if (game === null) {
            return;
        }
        soundManager.playNextButton(); // sonido de click del boton
        const property = game.buyHint();
        updateShopScreen();
        const moneyCounterEl = document.querySelector("#money-counter");
        if (moneyCounterEl !== null) {
            moneyCounterEl.textContent = "Dinero: " + game.money;
        }
        if (property === null) {
            return; // visitante limpio (o no alcanzaba el dinero) - nada que resaltar
        }
        const selector = hintTargetSelector(property);
        if (selector === null) {
            return;
        }
        const targetEl = document.querySelector(selector);
        if (targetEl === null) {
            return;
        }
        targetEl.classList.add("hint-highlight");
        window.setTimeout(() => {
            targetEl.classList.remove("hint-highlight");
        }, HINT_HIGHLIGHT_MS);
    });
    document.querySelector("#shop-extra-time-btn")?.addEventListener("click", () => {
        const game = getGame();
        if (game === null) {
            return;
        }
        soundManager.playNextButton(); // sonido de click del boton
        const bought = game.buyExtraTime();
        if (!bought) {
            return;
        }
        // la tienda esta abierta con el dia en pausa (ver dayTimer.pause() en el
        // listener de #shop-btn) - sumar tiempo extra reprograma el cierre del dia
        // con el tiempo real que queda cuando se cierre la tienda (dayTimer.resume())
        dayTimer.addExtraTime(EXTRA_TIME_MS);
        updateShopScreen();
        const moneyCounterEl = document.querySelector("#money-counter");
        if (moneyCounterEl !== null) {
            moneyCounterEl.textContent = "Dinero: " + game.money;
        }
    });
    document.querySelector("#shop-insurance-btn")?.addEventListener("click", () => {
        const game = getGame();
        if (game === null) {
            return;
        }
        soundManager.playNextButton(); // sonido de click del boton
        const bought = game.buyInsurance();
        if (!bought) {
            return;
        }
        updateShopScreen();
        const moneyCounterEl = document.querySelector("#money-counter");
        if (moneyCounterEl !== null) {
            moneyCounterEl.textContent = "Dinero: " + game.money;
        }
    });
}
//# sourceMappingURL=shop.js.map