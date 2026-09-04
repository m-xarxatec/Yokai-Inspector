import { Game } from "./classes/Game.js";
import { SoundManager } from "./classes/SoundManager.js";
import { DayTimer } from "./classes/DayTimer.js";

const EXTRA_TIME_MS = 15000;

// registra los listeners de la tienda - getGame()/getTimerEnabled() se llaman
// en cada evento (no una sola vez al iniciar) porque esos valores cambian con
// el tiempo (nueva partida, toggle de opciones), no con la carga del modulo.
export function initShop(
  getGame: () => Game | null,
  getTimerEnabled: () => boolean,
  soundManager: SoundManager,
  dayTimer: DayTimer,
  changeState: (newState: string) => void
): void {
  // refresca el dinero mostrado y deshabilita los botones de compra que ya no
  // se pueden pagar - se llama al abrir la tienda y despues de cada compra
  function updateShopScreen(): void {
    const game = getGame();
    if (game === null) {
      return;
    }
    const moneyEl = document.querySelector("#shop-money");
    if (moneyEl !== null) {
      moneyEl.textContent = String(game.money);
    }
    const extraTimeBtn = document.querySelector("#shop-extra-time-btn") as HTMLButtonElement | null;
    if (extraTimeBtn !== null) {
      extraTimeBtn.disabled = game.money < game.extraTimeCost || game.usedExtraTimeToday;
    }
    const insuranceBtn = document.querySelector("#shop-insurance-btn") as HTMLButtonElement | null;
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
