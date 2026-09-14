import { Game } from "./classes/Game.js";
import { SoundManager } from "./classes/SoundManager.js";
import { DayTimer } from "./classes/DayTimer.js";

const EXTRA_TIME_MS = 15000;

export function initShop(
  getGame: () => Game | null,
  getTimerEnabled: () => boolean,
  soundManager: SoundManager,
  dayTimer: DayTimer,
  changeState: (newState: string) => void
): void {
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
    soundManager.playNextButton();
    dayTimer.pause();
    updateShopScreen();
    changeState("shop");
  });

  document.querySelector("#shop-continue-btn")?.addEventListener("click", () => {
    soundManager.playNextButton();
    changeState("game");
    dayTimer.resume(getTimerEnabled());
  });

  document.querySelector("#shop-extra-time-btn")?.addEventListener("click", () => {
    const game = getGame();
    if (game === null) {
      return;
    }
    soundManager.playNextButton();
    const bought = game.buyExtraTime();
    if (!bought) {
      return;
    }
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
    soundManager.playNextButton();
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
