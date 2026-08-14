import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory, savePlayerName, loadPlayerName, getAllCredits } from "./Storage.js";

let game: Game | null = null;
let currentState: string = "menu";

// la duracion tiene que coincidir con la transicion de "left" de #character-portrait en style.css
const PORTRAIT_ANIM_MS = 450;
const PORTRAIT_REST_LEFT = "34.8%";

// tiempo para decidir por visitante: baja con cada dia, y se divide a la mitad en modo alerta
const TIME_PER_VISITOR_BASE_MS = 16000;
const TIME_PER_VISITOR_STEP_MS = 1500;
const ALERT_MODE_ERROR_STREAK = 2;

let racha: number = 0;
let erroresSeguidos: number = 0;
let timerEnabled: boolean = true;

// variantes del retrato de la Jefa cuando explica las reglas entre dias; se elige
// una al azar cada vez, para que no sea siempre la misma pose
const JEFA_EXPLICA_VARIANTS = ["jefaExplica-1", "jefaExplica-2", "jefaExplica-3", "jefaExplica-4", "jefaExplica-5"];

// cuadros de la moneda que gira junto al dinero, en orden de ida y vuelta para
// que el giro se vea continuo (sin salto entre el ultimo cuadro y el primero)
const COIN_SPIN_FRAMES = ["moneda-1", "moneda-2", "moneda-3", "moneda-4", "moneda-3", "moneda-2"];

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
  const partidaGuardada = loadCurrentGame();

  if (boton !== null) {
    boton.disabled = partidaGuardada === null;
  }

  const estadoEl = document.querySelector("#paused-status");
  if (estadoEl === null) {
    return;
  }
  const estadoHtmlEl = estadoEl as HTMLElement;
  if (partidaGuardada === null) {
    estadoHtmlEl.classList.add("hidden");
    return;
  }
  estadoHtmlEl.classList.remove("hidden");
  estadoEl.textContent = "⏸ Partida pausada — Día " + partidaGuardada.dayNumber + " / 7";
}

function updateTimerToggleButton(): void {
  const boton = document.querySelector("#timer-toggle-btn");
  if (boton === null) {
    return;
  }
  if (timerEnabled) {
    boton.textContent = "Desactivar temporizador";
  } else {
    boton.textContent = "Activar temporizador";
  }
}

document.querySelector("#timer-toggle-btn")?.addEventListener("click", () => {
  timerEnabled = !timerEnabled;
  updateTimerToggleButton();
});

function updatePlayerNameDisplay(): void {
  const displayEl = document.querySelector("#player-name-display");
  if (displayEl === null) {
    return;
  }
  const nombre = loadPlayerName();
  displayEl.textContent = nombre === "" ? "" : "Inspector: " + nombre;
}

document.querySelector("#player-name-form")?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const input = document.querySelector("#player-name-input") as HTMLInputElement | null;
  if (input === null) {
    return;
  }
  savePlayerName(input.value.trim());
  input.value = "";
  updatePlayerNameDisplay();
});

document.querySelectorAll(".back-link").forEach(boton => {
  boton.addEventListener("click", () => {
    changeState("menu");
  });
});

// disponible desde historia/juego/resultado del dia: vuelve al menu sin terminar
// el dia actual, tal como quedaria si se recargara la pagina a mitad de partida
// (la partida guardada solo se actualiza al empezar cada dia, asi que sigue
// disponible para "Continuar partida" desde donde arranco el dia).
document.querySelectorAll(".exit-to-menu-btn").forEach(boton => {
  boton.addEventListener("click", () => {
    clearVisitorTimer();
    if (dialogueIntervalId !== null) {
      clearInterval(dialogueIntervalId);
      dialogueIntervalId = null;
    }
    changeState("menu");
    renderHistoryTable();
    updateContinueButton();
  });
});

document.querySelector("#options-btn")?.addEventListener("click", () => {
  changeState("options");
});

document.querySelector("#exit-btn")?.addEventListener("click", () => {
  changeState("exit");
});

document.querySelector("#credits-btn")?.addEventListener("click", () => {
  renderCreditsScreen();
  changeState("credits");
});

function renderCreditsScreen(): void {
  const listaEl = document.querySelector("#credits-list");
  if (listaEl === null) {
    return;
  }
  listaEl.innerHTML = "";
  const creditos = getAllCredits();
  const entradas = Object.entries(creditos).sort((a, b) => b[1] - a[1]);

  if (entradas.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Todavía no hay créditos acumulados. ¡Terminá una partida para sumar!";
    listaEl.appendChild(item);
    return;
  }

  entradas.forEach(([nombre, total]) => {
    const item = document.createElement("li");
    item.textContent = nombre + " — " + total + " créditos";
    listaEl.appendChild(item);
  });
}

function renderHistoryTable(): void {
  const tabla = document.querySelector("#history-table tbody");
  if (tabla === null) {
    return;
  }

  tabla.innerHTML = "";
  const historial = getHistory();

  historial.forEach(resultado => {
    const fila = document.createElement("tr");

    const nombreCelda = document.createElement("td");
    nombreCelda.textContent = resultado.name ?? "—";
    fila.appendChild(nombreCelda);

    const diaCelda = document.createElement("td");
    diaCelda.textContent = "Día " + resultado.day + " / 7";
    fila.appendChild(diaCelda);

    const erroresCelda = document.createElement("td");
    erroresCelda.textContent = resultado.errors + " errores";
    fila.appendChild(erroresCelda);

    const dineroCelda = document.createElement("td");
    dineroCelda.textContent = "$" + resultado.money;
    fila.appendChild(dineroCelda);

    const resultadoCelda = document.createElement("td");
    if (resultado.result === "victoria") {
      resultadoCelda.textContent = "🏆 Victoria";
      resultadoCelda.className = "resultado-victoria";
    }
    if (resultado.result === "derrota") {
      resultadoCelda.textContent = "💀 Derrota";
      resultadoCelda.className = "resultado-derrota";
    }
    fila.appendChild(resultadoCelda);

    tabla.appendChild(fila);
  });
}

document.querySelector("#new-game-btn")?.addEventListener("click", () => {
  game = new Game(loadPlayerName());
  racha = 0;
  erroresSeguidos = 0;
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.startNewGame();
    changeState("story");
  });
});

document.querySelector("#story-next-btn")?.addEventListener("click", () => {
  renderDayResultScreen(false);
  changeState("day-result");
});

document.querySelector("#continue-btn")?.addEventListener("click", () => {
  game = new Game(loadPlayerName());
  racha = 0;
  erroresSeguidos = 0;
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

// --- efecto de dialogo tipo subtitulo (palabra por palabra) ---

let dialogueIntervalId: number | null = null;

function typeDialogue(texto: string, selectorDestino: string): void {
  const dialogoEl = document.querySelector(selectorDestino);
  if (dialogoEl === null) {
    return;
  }

  if (dialogueIntervalId !== null) {
    clearInterval(dialogueIntervalId);
  }

  const palabras = texto.split(" ");
  dialogoEl.textContent = "";
  let indice = 0;

  dialogueIntervalId = window.setInterval(() => {
    dialogoEl.textContent = palabras.slice(0, indice + 1).join(" ");
    indice += 1;
    if (indice >= palabras.length) {
      if (dialogueIntervalId !== null) {
        clearInterval(dialogueIntervalId);
      }
      dialogueIntervalId = null;
    }
  }, 160);
}

// --- entrada/salida del personaje (desliza en vez de aparecer de la nada) ---

function resetPortraitOffscreen(): void {
  const portrait = document.querySelector("#character-portrait") as HTMLElement | null;
  if (portrait === null) {
    return;
  }
  portrait.style.transition = "none";
  portrait.style.left = "130%";
  void portrait.offsetWidth; // fuerza el reflow para que el salto instantaneo se registre antes de reactivar la transicion
  portrait.style.transition = "";
  portrait.style.left = PORTRAIT_REST_LEFT;
}

function slideOutPortrait(direccion: "izquierda" | "derecha", alTerminar: () => void): void {
  const portrait = document.querySelector("#character-portrait") as HTMLElement | null;
  const acceptBtn = document.querySelector("#accept-btn") as HTMLButtonElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLButtonElement | null;

  if (acceptBtn !== null) acceptBtn.disabled = true;
  if (rejectBtn !== null) rejectBtn.disabled = true;

  if (portrait !== null) {
    if (direccion === "izquierda") {
      portrait.style.left = "-70%";
    }
    if (direccion === "derecha") {
      portrait.style.left = "130%";
    }
  }

  window.setTimeout(alTerminar, PORTRAIT_ANIM_MS);
}

// --- tiempo limite por visitante ---

let visitorTimeoutId: number | null = null;

function clearVisitorTimer(): void {
  if (visitorTimeoutId !== null) {
    clearTimeout(visitorTimeoutId);
    visitorTimeoutId = null;
  }
}

function startVisitorTimer(): void {
  clearVisitorTimer();

  const barraTrackEl = document.querySelector("#time-bar-track") as HTMLElement | null;
  if (!timerEnabled) {
    if (barraTrackEl !== null) {
      barraTrackEl.classList.add("hidden");
    }
    return;
  }
  if (barraTrackEl !== null) {
    barraTrackEl.classList.remove("hidden");
  }

  if (game === null) {
    return;
  }

  const duracionNormalMs = Math.max(TIME_PER_VISITOR_BASE_MS - (game.dayNumber - 1) * TIME_PER_VISITOR_STEP_MS, 6000);
  const enAlerta = erroresSeguidos >= ALERT_MODE_ERROR_STREAK;
  const duracionMs = enAlerta ? duracionNormalMs / 2 : duracionNormalMs;

  const barraEl = document.querySelector("#time-bar-fill") as HTMLElement | null;
  if (barraEl !== null) {
    barraEl.classList.remove("corriendo");
    void barraEl.offsetWidth; // fuerza el reflow para poder reiniciar la animacion desde cero
    barraEl.style.animationDuration = duracionMs + "ms";
    barraEl.classList.add("corriendo");
    barraEl.classList.toggle("alerta", enAlerta);
  }

  visitorTimeoutId = window.setTimeout(() => {
    if (game === null || game.currentVisitor === null) {
      return;
    }
    // se acabo el tiempo: fuerza la respuesta contraria a la correcta (siempre cuenta como error)
    const violacion = game.currentDay.evaluateCharacter(game.currentVisitor);
    const respuestaCorrectaEsAceptar = violacion === null;
    resolveDecision(!respuestaCorrectaEsAceptar);
  }, duracionMs);
}

function renderVisitor(): void {
  if (game === null || game.currentVisitor === null) {
    return;
  }

  resetPortraitOffscreen();

  const acceptBtn = document.querySelector("#accept-btn") as HTMLButtonElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLButtonElement | null;
  if (acceptBtn !== null) acceptBtn.disabled = false;
  if (rejectBtn !== null) rejectBtn.disabled = false;

  const visitante = game.currentVisitor;
  const pasaporte = visitante.obtainPassport;

  const nombreEl = document.querySelector("#passport-name");
  const regionEl = document.querySelector("#passport-region");
  const especieEl = document.querySelector("#passport-species");
  const selloEl = document.querySelector("#passport-stamp");

  if (nombreEl !== null) nombreEl.textContent = pasaporte.obtainName;
  if (regionEl !== null) regionEl.textContent = pasaporte.obtainRegion;
  if (selloEl !== null) selloEl.textContent = pasaporte.obtainStamp;

  // la especie declarada recien se revela a partir del dia 4 (ver mensajeIntro de ese dia)
  if (especieEl !== null) {
    const especieHtmlEl = especieEl as HTMLElement;
    if (game.dayNumber >= 4) {
      especieHtmlEl.style.display = "";
      especieEl.textContent = pasaporte.obtainDeclaredSpecie;
    } else {
      especieHtmlEl.style.display = "none";
    }
  }

  typeDialogue(visitante.dialogueLine(), "#dialogue-bubble");

  const faceEl = document.querySelector(".part-face");
  const eyesEl = document.querySelector(".part-eyes");
  const mouthEl = document.querySelector(".part-mouth");
  const hairEl = document.querySelector(".part-hair");
  const hornsEl = document.querySelector(".part-horns") as HTMLElement | null;

  if (faceEl !== null) faceEl.className = "part part-face " + visitante.obtainFace;
  if (eyesEl !== null) {
    const eyesVariant = visitante.obtainYellowEyes ? "yellowEyes" : visitante.obtainEyes;
    eyesEl.className = "part part-eyes " + eyesVariant;
  }
  if (mouthEl !== null) mouthEl.className = "part part-mouth " + visitante.obtainMouth;
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
  const erroresEl = document.querySelector("#error-counter") as HTMLElement | null;
  const dineroEl = document.querySelector("#money-counter");
  const rachaEl = document.querySelector("#streak-counter");

  if (diaEl !== null) diaEl.textContent = "Día " + game.dayNumber + " / 7";
  if (erroresEl !== null) {
    erroresEl.textContent = "Errores: " + game.errors + " / 4";
    if (game.errors >= 3) {
      erroresEl.classList.add("danger");
    } else {
      erroresEl.classList.remove("danger");
    }
  }
  if (dineroEl !== null) dineroEl.textContent = "Dinero: " + game.money;
  if (rachaEl !== null) rachaEl.textContent = "Racha: " + racha;

  startVisitorTimer();
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

function resolveDecision(accept: boolean): void {
  if (game === null) {
    return;
  }
  clearVisitorTimer();

  const diaAntes = game.dayNumber;
  const erroresAntes = game.errors;
  const direccion = accept ? "izquierda" : "derecha";

  slideOutPortrait(direccion, () => {
    if (game === null) {
      return;
    }
    game.decide(accept);

    if (game.errors > erroresAntes) {
      racha = 0;
      erroresSeguidos += 1;
    } else {
      racha += 1;
      erroresSeguidos = 0;
    }

    afterDecision(diaAntes);
  });
}

document.querySelector("#accept-btn")?.addEventListener("click", () => {
  resolveDecision(true);
});

document.querySelector("#reject-btn")?.addEventListener("click", () => {
  resolveDecision(false);
});

// --- Day result screen ---

function renderDayResultScreen(mostrarResumen: boolean = true): void {
  if (game === null) {
    return;
  }

  const resumenEl = document.querySelector("#day-result-summary");
  const mensajeEl = document.querySelector("#next-day-message");

  if (resumenEl !== null) {
    const resumenHtmlEl = resumenEl as HTMLElement;
    if (mostrarResumen) {
      resumenHtmlEl.classList.remove("hidden");
      resumenEl.textContent = "Errores acumulados: " + game.errors + " / 4 — Dinero: " + game.money;
    } else {
      resumenHtmlEl.classList.add("hidden");
    }
  }
  const jefaEl = document.querySelector("#jefa-portrait");
  if (jefaEl !== null) {
    const variante = JEFA_EXPLICA_VARIANTS[Math.floor(Math.random() * JEFA_EXPLICA_VARIANTS.length)];
    jefaEl.className = variante;
  }

  if (mensajeEl !== null) {
    typeDialogue(game.currentDay.getIntroMessage(), "#next-day-message");
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

  const gano = game.isWon();

  const escenaEl = document.querySelector("#final-scene");
  if (escenaEl !== null) {
    const escenaHtmlEl = escenaEl as HTMLElement;
    escenaHtmlEl.classList.remove("derrota");
    if (gano) {
      // todavia no hay arte para la victoria - se oculta el cuadro en vez de mostrarlo vacio
      escenaHtmlEl.classList.add("hidden");
    } else {
      escenaHtmlEl.classList.remove("hidden");
      escenaHtmlEl.classList.add("derrota");
    }
  }

  if (gano) {
    typeDialogue("¡Salvaste el mundo! Como agradecimiento, la agencia te asciende a Jefe de Sección (con oficina nueva, aunque sin ventana) y además te regalan un unicornio de peluche gigante que insiste en llamarse \"Su Majestad\".", "#final-message");
  }
  if (game.isLost()) {
    typeDialogue("Te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo.", "#final-message");
  }
}

document.querySelector("#back-to-menu-btn")?.addEventListener("click", () => {
  changeState("menu");
  renderHistoryTable();
  updateContinueButton();
});

// --- Precarga de imagenes (evita el parpadeo al cambiar de visitante) ---

function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

function preloadCharacterImages(): void {
  fetch("data/partes.json")
    .then(r => r.json())
    .then(partes => {
      const rostroUrls = partes.rostro.map((nombre: string) => "img/baseCharacters/" + nombre + ".png");
      const ojosUrls = partes.ojos.map((nombre: string) => "img/eyes/" + nombre + ".png");
      const bocaUrls = partes.boca.map((nombre: string) => "img/mouth/" + nombre + ".png");
      preloadImages(rostroUrls);
      preloadImages(ojosUrls);
      preloadImages(bocaUrls);
      preloadImages(["img/eyes/" + partes.ojosAmarillos + ".png"]);
    })
    .catch(error => console.log("no se pudieron precargar las imagenes", error));
}

// --- Moneda girando junto al dinero (solo se ve mientras #game-screen esta visible,
// pero el intervalo arranca una sola vez y queda corriendo, mas simple que prenderlo
// y apagarlo en cada cambio de pantalla) ---

function startCoinSpin(): void {
  const monedaEl = document.querySelector("#coin-spin");
  if (monedaEl === null) {
    return;
  }
  let indice = 0;
  window.setInterval(() => {
    indice = (indice + 1) % COIN_SPIN_FRAMES.length;
    monedaEl.className = COIN_SPIN_FRAMES[indice];
  }, 120);
}

// --- Estado inicial al cargar la página ---

updateContinueButton();
updateTimerToggleButton();
updatePlayerNameDisplay();
renderHistoryTable();
preloadCharacterImages();
startCoinSpin();
