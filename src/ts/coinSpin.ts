const COIN_SPIN_FRAMES = ["moneda-1", "moneda-2", "moneda-3", "moneda-4", "moneda-3", "moneda-2"];

export function startCoinSpin(): void {
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
