import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory } from "./Storage.js";

let game: Game | null = null;
let currentState: string = "menu";

function changeState(newState: string): void {
  currentState = newState;
  document.querySelectorAll("section").forEach(section => {
    section.classList.add("hidden");
  });
  document.querySelector(`#${newState}-screen`)?.classList.remove("hidden");
}

// --- Menu screen ---

function updateContinueButton(): void {
  const boton = document.querySelector("#continue-btn") as HTMLButtonElement | null;
  if (boton === null) {
    return;
  }
  boton.disabled = loadCurrentGame() === null;
}

function renderHistoryTable(): void {
  const tabla = document.querySelector("#history-table");
  if (tabla === null) {
    return;
  }

  tabla.innerHTML = "";
  const historial = getHistory();

  historial.forEach(resultado => {
    const fila = document.createElement("tr");
    Object.values(resultado).forEach(valor => {
      const celda = document.createElement("td");
      celda.textContent = String(valor);
      fila.appendChild(celda);
    });
    tabla.appendChild(fila);
  });
}

document.querySelector("#new-game-btn")?.addEventListener("click", () => {
  game = new Game();
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.startNewGame();
    changeState("game");
    renderVisitor();
  });
});

document.querySelector("#continue-btn")?.addEventListener("click", () => {
  game = new Game();
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.loadProgress();
    changeState("game");
    renderVisitor();
  });
});

// --- Game screen ---

function renderVisitor(): void {
  if (game === null || game.currentVisitor === null) {
    return;
  }

  const visitante = game.currentVisitor;
  const pasaporte = visitante.obtainPassport;

  const nombreEl = document.querySelector("#passport-name");
  const regionEl = document.querySelector("#passport-region");
  const especieEl = document.querySelector("#passport-species");
  const selloEl = document.querySelector("#passport-stamp");

  if (nombreEl !== null) nombreEl.textContent = pasaporte.obtainName;
  if (regionEl !== null) regionEl.textContent = pasaporte.obtainRegion;
  if (especieEl !== null) especieEl.textContent = pasaporte.obtainDeclaredSpecie;
  if (selloEl !== null) selloEl.textContent = pasaporte.obtainStamp;

  const dialogoEl = document.querySelector("#dialogue-bubble");
  if (dialogoEl !== null) {
    dialogoEl.textContent = visitante.dialogueLine();
  }

  const faceEl = document.querySelector(".part-face");
  const eyesEl = document.querySelector(".part-eyes");
  const noseEl = document.querySelector(".part-nose");
  const earEl = document.querySelector(".part-ear");
  const hairEl = document.querySelector(".part-hair");
  const hornsEl = document.querySelector(".part-horns") as HTMLElement | null;

  if (faceEl !== null) faceEl.className = "part part-face " + visitante.obtainFace;
  if (eyesEl !== null) eyesEl.className = "part part-eyes " + visitante.obtainEyes;
  if (noseEl !== null) noseEl.className = "part part-nose " + visitante.obtainNose;
  if (earEl !== null) earEl.className = "part part-ear " + visitante.obtainEar;
  if (hairEl !== null) hairEl.className = "part part-hair " + visitante.obtainHair;

  if (hornsEl !== null) {
    if (visitante.obtainHaveHorns) {
      hornsEl.className = "part part-horns " + visitante.obtainHorns;
      hornsEl.style.display = "";
    } else {
      hornsEl.style.display = "none";
    }
  }

  const diaEl = document.querySelector("#day-counter");
  const erroresEl = document.querySelector("#error-counter");
  const dineroEl = document.querySelector("#money-counter");

  if (diaEl !== null) diaEl.textContent = "Día " + game.dayNumber + " / 5";
  if (erroresEl !== null) erroresEl.textContent = "Errores: " + game.errors + " / 5";
  if (dineroEl !== null) dineroEl.textContent = "Dinero: " + game.money;
}

function afterDecision(diaAntes: number): void {
  if (game === null) {
    return;
  }

  if (game.isLost() || game.isWon()) {
    renderFinalScreen();
    changeState("final");
    return;
  }

  if (game.dayNumber > diaAntes) {
    renderDayResultScreen();
    changeState("day-result");
    return;
  }

  renderVisitor();
}

document.querySelector("#accept-btn")?.addEventListener("click", () => {
  if (game === null) {
    return;
  }
  const diaAntes = game.dayNumber;
  game.decide(true);
  afterDecision(diaAntes);
});

document.querySelector("#reject-btn")?.addEventListener("click", () => {
  if (game === null) {
    return;
  }
  const diaAntes = game.dayNumber;
  game.decide(false);
  afterDecision(diaAntes);
});

// --- Day result screen ---

function renderDayResultScreen(): void {
  if (game === null) {
    return;
  }

  const resumenEl = document.querySelector("#day-result-summary");
  const mensajeEl = document.querySelector("#next-day-message");

  if (resumenEl !== null) {
    resumenEl.textContent = "Errores acumulados: " + game.errors + " / 5 — Dinero: " + game.money;
  }
  if (mensajeEl !== null) {
    mensajeEl.textContent = game.currentDay.getIntroMessage();
  }
}

document.querySelector("#continue-day-btn")?.addEventListener("click", () => {
  changeState("game");
  renderVisitor();
});

// --- Final screen ---

function renderFinalScreen(): void {
  if (game === null) {
    return;
  }

  const mensajeEl = document.querySelector("#final-message");
  if (mensajeEl === null) {
    return;
  }

  if (game.isWon()) {
    mensajeEl.textContent = "¡Salvaste el mundo! Como agradecimiento, la agencia te asciende a Jefe de Sección (con oficina nueva, aunque sin ventana) y además te regalan un unicornio de peluche gigante que insiste en llamarse \"Su Majestad\".";
  } else if (game.isLost()) {
    mensajeEl.textContent = "Te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo.";
  }
}

document.querySelector("#back-to-menu-btn")?.addEventListener("click", () => {
  changeState("menu");
  renderHistoryTable();
  updateContinueButton();
});

// --- Estado inicial al cargar la página ---

updateContinueButton();
renderHistoryTable();
