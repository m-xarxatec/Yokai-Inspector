// --- Moneda girando junto al dinero (solo se ve mientras #game-screen esta visible,
// pero el intervalo arranca una sola vez y queda corriendo, mas simple que prenderlo
// y apagarlo en cada cambio de pantalla) ---
// cuadros de la moneda que gira junto al dinero, en orden de ida y vuelta para
// que el giro se vea continuo (sin salto entre el ultimo cuadro y el primero)
const COIN_SPIN_FRAMES = ["moneda-1", "moneda-2", "moneda-3", "moneda-4", "moneda-3", "moneda-2"];
export function startCoinSpin() {
    const coinEl = document.querySelector("#coin-spin");
    if (coinEl === null) {
        return;
    }
    let index = 0;
    window.setInterval(() => {
        index = (index + 1) % COIN_SPIN_FRAMES.length;
        coinEl.className = COIN_SPIN_FRAMES[index];
    }, 120);
}
//# sourceMappingURL=coinSpin.js.map