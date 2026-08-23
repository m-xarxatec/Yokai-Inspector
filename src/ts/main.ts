import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory, savePlayerName, loadPlayerName, getAllCredits, saveDayStreaks, loadDayStreaks, getResultStreak, clearSavedGames } from "./Storage.js";
import { SoundManager } from "./classes/SoundManager.js";
import { MusicManager } from "./classes/MusicManager.js";

let game: Game | null = null;
let currentState: string = "menu";
const soundManager = new SoundManager();
const musicManager = new MusicManager();

// el menu ya esta visible por defecto en el HTML (arranca en "menu" sin pasar
// por changeState()), y los navegadores bloquean el audio hasta la primera
// interaccion del usuario: se intenta reproducir de una, y si el navegador lo
// bloquea, se reintenta en el primer click/tecla que haga en cualquier parte
musicManager.playMenu();
document.addEventListener("pointerdown", () => {
  if (currentState === "menu") {
    musicManager.playMenu();
  }
}, { once: true });

// racha con la que termino cada dia de la partida en curso - se guarda en
// localStorage al cerrar cada dia (ver afterDecision()), todavia sin usarse
// para nada mas (queda preparada para una idea a futuro, ver docs/ideas.md)
let dayStreaks: number[] = [];

// la duracion tiene que coincidir con la transicion de "left" de #character-portrait en style.css
const PORTRAIT_ANIM_MS = 450;
// tiene que coincidir con el "left" de #character-portrait en style.css
const PORTRAIT_REST_LEFT = "49%";

// duracion de la transicion "en el sitio" (abrir/cerrar sobre el escritorio,
// sin moverse) - tiene que coincidir con la transicion de top/height de
// #passport-object en style.css
const PASSPORT_ANIM_MS = 400;

// duracion del arco (lanzado/devuelto) - ver animatePassportAlongArc() mas abajo
const PASSPORT_ARC_MS = 700;

// puntos del arco parabolico (izquierda/arriba en %, mas la altura del pasaporte
// en cada punta): sale de la base del personaje, chico, pasa por un punto alto
// (a la altura de la ventanilla, dandole la curva) y cae sobre el escritorio, un
// poco mas grande. La vuelta (al decidir) es la misma curva al reves.
// BASE.left = centro horizontal real de #character-portrait (left + width/2
// = 49+18/2 = 58%), no su rostro/centro - para que se vea salir literalmente
// de su base, no flotando en la mitad del cuerpo.
// BASE.top: tiene que caer DENTRO de la franja que tapa el escritorio
// (#scene-desktop va de 53.68% a 86.39% de alto, z-index 4, delante del
// personaje) para que la devolucion se vea "esconderse detras del
// escritorio", como pidio Mike - ni tan arriba que quede a la vista (se
// probo 52%, quedaba a la altura del pecho, no de la base) ni tan abajo que
// se pase del borde inferior del escritorio hacia la barra de dialogo (se
// probo 89%, el borde geometrico de la caja del personaje, y se veia
// "hundirse" de mas, saliendose por debajo del escritorio). 71% es la base
// REAL del dibujo del personaje dentro de su caja (donde termina el
// contenido visible de rostro-N.png con "contain", antes del margen vacio
// que deja la caja mas angosta - ver el mismo calculo en el comentario de
// .part-horns en style.css), y ademas cae comodo en el medio de la franja
// del escritorio.
// DESK.top re-ajustado cuando DesktopNew.png se achico - el escritorio real
// ahora ocupa solo hasta ~86% de alto (antes desktop.png llegaba al 100%),
// asi que el pasaporte tiene que aterrizar mas arriba para no pisar la barra
// de dialogo.
const PASSPORT_ARC_BASE = { left: 58, top: 71, height: 3 };
const PASSPORT_ARC_CONTROL = { left: 55, top: -35 };
const PASSPORT_ARC_DESK = { left: 60, top: 68, height: 16 };

// variantes de "apoyado sobre la mesa" (pasaporte1/2/3.png) que reemplazan a
// pasaporte.png una vez que la entrega termina de caer - ver el final de
// renderVisitor(). La devolucion no las usa: antes de arrancar el arco de
// vuelta se sacan de nuevo, asi que el personaje siempre se lo lleva mostrando
// pasaporte.png, como si el cambio de imagen fuera solo "una vez posado".
const PASSPORT_DESK_LOOK_VARIANTS = ["desk1", "desk2", "desk3"];

// el z-index no puede depender solo de la altura del arco: la base del personaje
// (88%) y el escritorio (80%) estan demasiado cerca en top como para distinguirlos
// asi. Se distingue por direccion, y cada direccion necesita su propia señal:
//
// - devolucion: al frente solo en el primer tramo del recorrido (recien cerrado
//   sobre el escritorio), detras el resto - un umbral de tiempo alcanza.
// - entrega: sale detras (se pierde detras de la ventanilla al subir), y pasa al
//   frente en cuanto cruza el punto mas alto del arco y empieza a caer - de ahi
//   en adelante se queda al frente hasta aterrizar (ver yaPasoElPico en
//   animatePassportAlongArc). No alcanza un umbral fijo de tiempo/altura porque
//   el arco es asimetrico (el pico no cae a la mitad del recorrido).
const PASSPORT_ARC_FRONT_THRESHOLD = 0.7;
const PASSPORT_BEHIND_Z_INDEX = "2";

// cubic-bezier de desaceleracion sin overshoot (el 4to valor no pasa de 1): sin
// rebote al llegar, frena suave - se aplica igual en la entrega y la vuelta
const PASSPORT_ARC_EASING = createCubicBezierEasing(0.33, 1, 0.68, 1);

// pausa despues de que el personaje termina de llegar (y ya esta con la animacion
// idle) antes de que aparezca el pasaporte - da la sensacion de que lo entrega al
// llegar, no de que lo trae consigo mientras se desliza
const PASSPORT_DELIVERY_DELAY_MS = 500;

// una vez que el jugador hace click sobre el pasaporte cerrado, espera un poco
// antes de abrirlo (para que se sienta como que se abre, no que cambia de golpe)
const PASSPORT_OPEN_DELAY_MS = 150;

// cuanto se ve el sello de aceptado/rechazado sobre el pasaporte todavia abierto
// antes de que empiece a cerrarse
const DECISION_STAMP_FLASH_MS = 400;

// tiempo del dia completo (ya no es por visitante) - la dificultad ya sube
// sola por la proporcion de problematicos y la cantidad de reglas activas
// por dia. Elegible desde el menu principal (ver #day-duration-slider).
let DAY_DURATION_MS = 90000;

let streak: number = 0;
// pico de racha alcanzado en el dia en curso (streak solo no alcanza: si hubo
// un error a mitad de dia, streak al final puede ser menor al maximo real) -
// ver pantalla de resumen de fin de dia
let maxStreakToday: number = 0;
let timerEnabled: boolean = true;

// variantes del retrato de la Jefa cuando explica las reglas entre dias; se elige
// una al azar cada vez, para que no sea siempre la misma pose
const JEFA_EXPLICA_VARIANTS = ["jefaExplica-1", "jefaExplica-2", "jefaExplica-3", "jefaExplica-4", "jefaExplica-5"];

// cuadros de la moneda que gira junto al dinero, en orden de ida y vuelta para
// que el giro se vea continuo (sin salto entre el ultimo cuadro y el primero)
const COIN_SPIN_FRAMES = ["moneda-1", "moneda-2", "moneda-3", "moneda-4", "moneda-3", "moneda-2"];

function changeState(newState: string): void {
  currentState = newState;

  // saca el foco de lo que este enfocado (por ejemplo el input del nombre)
  // antes de cambiar de pantalla, asi no queda un cursor de texto parpadeando
  // "pegado" en una pantalla donde ya no corresponde
  const focusedEl = document.activeElement;
  if (focusedEl instanceof HTMLElement) {
    focusedEl.blur();
  }

  document.querySelectorAll("section").forEach(section => {
    section.classList.add("hidden");
  });
  document.querySelector(`#${newState}-screen`)?.classList.remove("hidden");

  // la musica de fondo suena SOLO en el menu principal - en cualquier otra
  // pantalla (nombre, historia, intro del dia, juego, etc.) se corta
  if (newState === "menu") {
    musicManager.playMenu();
  } else {
    musicManager.stop();
  }
}

// --- Menu screen ---

function updateContinueButton(): void {
  const button = document.querySelector("#continue-btn") as HTMLButtonElement | null;
  const savedGame = loadCurrentGame();

  if (button !== null) {
    button.disabled = savedGame === null;
  }

  const statusEl = document.querySelector("#paused-status");
  if (statusEl === null) {
    return;
  }
  const statusHtmlEl = statusEl as HTMLElement;
  if (savedGame === null) {
    statusHtmlEl.classList.add("hidden");
    return;
  }
  statusHtmlEl.classList.remove("hidden");
  statusEl.textContent = "⏸ Partida pausada — Día " + savedGame.dayNumber + " / " + (savedGame.totalDays ?? 7);
}

function updateTimerToggleButton(): void {
  const button = document.querySelector("#timer-toggle-btn");
  if (button === null) {
    return;
  }
  if (timerEnabled) {
    button.textContent = "Desactivar temporizador";
  } else {
    button.textContent = "Activar temporizador";
  }
}

document.querySelector("#timer-toggle-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  timerEnabled = !timerEnabled;
  updateTimerToggleButton();
});

// --- volumen: un solo control para la musica y todos los efectos juntos ---
document.querySelector("#volume-slider")?.addEventListener("input", (event) => {
  const raw = Number((event.target as HTMLInputElement).value) / 100;
  // curva cuadratica: el oido percibe el volumen de forma logaritmica, no
  // lineal - sin esto, valores "bajos" del slider seguian sonando fuerte
  const volume = raw * raw;
  soundManager.setVolume(volume);
  musicManager.setVolume(volume);
});

// --- zoom de la pantalla de juego: agranda #character-scene entero (HUD,
// --- personaje, pasaporte, todo junto - ya escala solo, ver --scene-zoom en style.css) ---
document.querySelector("#zoom-slider")?.addEventListener("input", (event) => {
  const zoom = Number((event.target as HTMLInputElement).value) / 100;
  document.documentElement.style.setProperty("--scene-zoom", String(zoom));
});

// --- duracion del dia y cantidad de dias de la partida: solo tienen efecto ---
// --- en la PROXIMA partida/dia que arranque, no a mitad de una en curso ---
const DAY_DURATION_OPTIONS_MS = [30000, 60000, 90000, 120000];

document.querySelector("#day-duration-slider")?.addEventListener("input", (event) => {
  const index = Number((event.target as HTMLInputElement).value);
  DAY_DURATION_MS = DAY_DURATION_OPTIONS_MS[index];
  const valueEl = document.querySelector("#day-duration-value");
  if (valueEl !== null) {
    valueEl.textContent = (DAY_DURATION_MS / 1000) + "s";
  }
});

let selectedTotalDays: number = 7;

document.querySelector("#total-days-slider")?.addEventListener("input", (event) => {
  selectedTotalDays = Number((event.target as HTMLInputElement).value);
  const valueEl = document.querySelector("#total-days-value");
  if (valueEl !== null) {
    valueEl.textContent = String(selectedTotalDays);
  }
});

// --- pantalla completa: usa la Fullscreen API nativa del navegador sobre ---
// --- document.body (no hay un contenedor #app aparte, todo cuelga de body) ---
function updateFullscreenButton(): void {
  const button = document.querySelector("#fullscreen-toggle-btn");
  if (button === null) {
    return;
  }
  if (document.fullscreenElement === null) {
    button.textContent = "Pantalla completa";
  } else {
    button.textContent = "Salir de pantalla completa";
  }
}

// tambien se actualiza si el usuario sale con la tecla Esc, no solo con el boton
document.addEventListener("fullscreenchange", () => {
  updateFullscreenButton();
});

document.querySelector("#fullscreen-toggle-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  if (document.fullscreenElement === null) {
    document.body.requestFullscreen().catch(() => {}); // activa pantalla completa
  } else {
    document.exitFullscreen().catch(() => {}); // sale de pantalla completa
  }
});

// al confirmar el nombre arranca la partida nueva (esto reemplaza lo que antes
// hacia el click de "Nueva partida" directamente)
document.querySelector("#player-name-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  soundManager.playNextButton(); // sonido de click del boton
  const input = document.querySelector("#player-name-input") as HTMLInputElement | null;
  input?.blur(); // saca el foco del input ya mismo (la carga de datos de abajo es async y tarda)
  const name = input?.value.trim() ?? "";
  savePlayerName(name);

  game = new Game(name, selectedTotalDays);
  streak = 0;
  dayStreaks = [];
  saveDayStreaks(dayStreaks);
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.startNewGame();
    renderStoryScreen();
    changeState("story");
  });
});

// a donde vuelve el "Volver al menu" de options/credits/exit - "menu" salvo
// que se haya entrado a options desde la pantalla de pausa (ver #pause-options-btn)
let backLinkTarget: string = "menu";

document.querySelectorAll(".back-link").forEach(button => {
  button.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    changeState(backLinkTarget);
  });
});

// disponible desde historia/juego/resultado del dia: vuelve al menu sin terminar
// el dia actual, tal como quedaria si se recargara la pagina a mitad de partida
// (la partida guardada solo se actualiza al empezar cada dia, asi que sigue
// disponible para "Continuar partida" desde donde arranco el dia). El boton
// de pausa (#pause-btn) y el de la tienda (#shop-btn) tienen su propio
// listener mas abajo, no entran aca.
document.querySelectorAll(".exit-to-menu-btn:not(#pause-btn):not(#shop-btn)").forEach(button => {
  button.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    soundManager.stopWrite(); // corta el sonido de escritura si todavia estaba sonando
    clearDayTimer();
    if (dialogueIntervalId !== null) {
      clearInterval(dialogueIntervalId);
      dialogueIntervalId = null;
    }
    // por si se sale a mitad de la intro del dia 1 o de una reaccion de error
    // (ambas viven en #day-result-screen) - sin esto, #continue-day-btn podria
    // arrancar mal la proxima vez que se llegue a esa pantalla en una partida
    // nueva (saltandose startDayTimer() por un errorReactionPending viejo, por ejemplo)
    introBeatIndex = null;
    errorReactionPending = false;
    changeState("menu");
    renderHistoryTable();
    updateContinueButton();
  });
});

// --- pausa real durante el juego: pausa el temporizador del dia de verdad ---
// --- (mismas pauseDayTimer()/resumeDayTimer() que ya usa la reaccion de la Jefa por error) ---
document.querySelector("#pause-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  pauseDayTimer();
  changeState("pause");
});

document.querySelector("#pause-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  changeState("game");
  resumeDayTimer();
});

// --- tienda: comprar con el dinero acumulado durante la partida (ver
// especificaciones-economia.md) ---
document.querySelector("#shop-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  pauseDayTimer();
  updateShopScreen();
  changeState("shop");
});

document.querySelector("#shop-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  changeState("game");
  resumeDayTimer();
});

const HINT_HIGHLIGHT_MS = 2500;
const EXTRA_TIME_MS = 15000;

// traduce la propiedad de la regla violada (ver Rule.getProperty()) al elemento
// que hay que resaltar - los rasgos fisicos (cuernos/ojos amarillos) se ven en
// el personaje, no en el pasaporte. "selloAlien" no entra: nunca es la regla
// violada que devuelve evaluateCharacter() (ver Rule.isViolated()).
function hintTargetSelector(property: string): string | null {
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

// refresca el dinero mostrado y deshabilita los botones de compra que ya no
// se pueden pagar - se llama al abrir la tienda y despues de cada compra
function updateShopScreen(): void {
  if (game === null) {
    return;
  }
  const moneyEl = document.querySelector("#shop-money");
  if (moneyEl !== null) {
    moneyEl.textContent = String(game.money);
  }
  const hintBtn = document.querySelector("#shop-hint-btn") as HTMLButtonElement | null;
  if (hintBtn !== null) {
    hintBtn.disabled = game.money < game.hintCost;
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

document.querySelector("#shop-hint-btn")?.addEventListener("click", () => {
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
  if (game === null) {
    return;
  }
  soundManager.playNextButton(); // sonido de click del boton
  const bought = game.buyExtraTime();
  if (!bought) {
    return;
  }
  // la tienda esta abierta con el dia en pausa (ver pauseDayTimer() en el
  // listener de #shop-btn) - restar del tiempo ya transcurrido equivale a
  // sumarle tiempo al reloj, y resumeDayTimer() (al cerrar la tienda) va a
  // reprogramar el cierre del dia con el tiempo real que queda
  dayElapsedMs = Math.max(dayElapsedMs - EXTRA_TIME_MS, 0);
  updateDayClock();
  updateShopScreen();
  const moneyCounterEl = document.querySelector("#money-counter");
  if (moneyCounterEl !== null) {
    moneyCounterEl.textContent = "Dinero: " + game.money;
  }
});

document.querySelector("#shop-insurance-btn")?.addEventListener("click", () => {
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

document.querySelector("#pause-options-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  backLinkTarget = "pause";
  // duracion del dia/dias de la partida solo tienen sentido antes de
  // arrancar una partida nueva, no a mitad de una en curso
  document.querySelector("#new-game-options")?.classList.add("hidden");
  changeState("options");
});

document.querySelector("#options-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  backLinkTarget = "menu";
  document.querySelector("#new-game-options")?.classList.remove("hidden");
  changeState("options");
});

document.querySelector("#exit-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  backLinkTarget = "menu";
  changeState("exit");
});

document.querySelector("#credits-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  backLinkTarget = "menu";
  renderCreditsScreen();
  changeState("credits");
});

function renderCreditsScreen(): void {
  const listaEl = document.querySelector("#credits-list");
  if (listaEl === null) {
    return;
  }
  listaEl.innerHTML = "";
  const credits = getAllCredits();
  const entries = Object.entries(credits).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Todavía no hay créditos acumulados. ¡Terminá una partida para sumar!";
    listaEl.appendChild(item);
    return;
  }

  entries.forEach(([name, total]) => {
    const item = document.createElement("li");
    item.textContent = name + " — " + total + " créditos";
    listaEl.appendChild(item);
  });
}

function renderHistoryTable(): void {
  const table = document.querySelector("#history-table tbody");
  if (table === null) {
    return;
  }

  table.innerHTML = "";
  const history = getHistory();

  history.forEach(entry => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = entry.name ?? "—";
    row.appendChild(nameCell);

    const dayCell = document.createElement("td");
    dayCell.textContent = "Día " + entry.day + " / " + (entry.totalDays ?? 7);
    row.appendChild(dayCell);

    const errorsCell = document.createElement("td");
    errorsCell.textContent = entry.errors + " errores";
    row.appendChild(errorsCell);

    const moneyCell = document.createElement("td");
    moneyCell.textContent = "$" + entry.money;
    row.appendChild(moneyCell);

    const resultCell = document.createElement("td");
    if (entry.result === "victoria") {
      resultCell.textContent = "🏆 Victoria";
      resultCell.className = "result-victoria";
    }
    if (entry.result === "derrota") {
      resultCell.textContent = "💀 Derrota";
      resultCell.className = "result-derrota";
    }
    row.appendChild(resultCell);

    table.appendChild(row);
  });
}

document.querySelector("#new-game-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  changeState("name-entry");
});

function renderStoryScreen(): void {
  if (game === null) {
    return;
  }
  const text = "Bienvenido, detective " + game.playerName + ". Eres un nuevo oficial de la Agencia de Aduana Espiritual, contratado el mismo día en que empieza tu turno (Día 1). Tu trabajo es revisar los pasaportes de quienes cruzan hacia el mundo humano y decidir si los dejas pasar, según las reglas que la agencia va confirmando día a día sobre los Yokai.";
  typeDialogue(text, "#story-text");
}

// --- intro escrita del dia 1 (3 cuadros con la Jefa, antes de arrancar a jugar) ---
//
// vive en #day-result-screen (mismo #jefa-portrait/#next-day-message que usa
// renderDayResultScreen() para el resumen entre dias) - #continue-day-btn
// avanza estos cuadros primero (ver mas abajo) y recien arranca el juego
// cuando se acaban.
type StoryBeat = { image: string; text: string };

const DAY_ONE_INTRO_BEATS: StoryBeat[] = [
  { image: "jefaPresentacion", text: "Es tu primer día en la agencia espiritual. Nadie te dio un manual de bienvenida, no lo necesitas porque en tu currículum dice que tienes mucha experiencia." },
  { image: "jefaNeutral", text: "La regla es muy clara: PROHIBIDA LA ENTRADA A QUIEN TENGA CUERNOS. Los oni no pasan." },
  { image: "jefaExplica-1", text: "Cuidado, ellos saben esconderlos bien. ¡Bienvenido a tu nuevo puesto!" },
];

let introBeatIndex: number | null = null;

function renderJefaBeat(beat: StoryBeat): void {
  const jefaEl = document.querySelector("#jefa-portrait");
  if (jefaEl !== null) jefaEl.className = beat.image;

  const summaryEl = document.querySelector("#day-result-summary") as HTMLElement | null;
  if (summaryEl !== null) summaryEl.classList.add("hidden");

  typeDialogue(beat.text, "#next-day-message");
}

// distingue, dentro de #day-result-screen, un cambio de regla (mensajeIntro/
// DAY_ONE_INTRO_BEATS) de una reaccion por error (ERROR_REACTIONS): el color
// del kicker es la unica pista visual, porque el propio parrafo usa siempre
// --font-body en los dos casos
function setNoticeType(type: string): void {
  const screenEl = document.querySelector("#day-result-screen");
  const kickerEl = document.querySelector("#notice-kicker");
  if (screenEl === null || kickerEl === null) {
    return;
  }
  screenEl.classList.remove("notice-rule", "notice-error");
  screenEl.classList.add(type === "rule" ? "notice-rule" : "notice-error");
  kickerEl.textContent = type === "rule" ? "NUEVA REGLA" : "¡ERROR!";
  if (type === "rule") {
    musicManager.playMenu(); // pantalla de la jefa explicando reglas: mismo sonido que el menu principal
  }
}

document.querySelector("#story-next-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  introBeatIndex = 0;
  changeState("day-result"); // primero cambia de pantalla para que no corte el audio de abajo
  setNoticeType("rule");
  renderJefaBeat(DAY_ONE_INTRO_BEATS[0]);
});

document.querySelector("#continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  game = new Game(loadPlayerName());
  streak = 0;
  dayStreaks = loadDayStreaks();
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.loadProgress();
    changeState("game");
    renderVisitor();
    startDayTimer();
  });
});

// --- Game screen ---

// --- efecto de dialogo tipo subtitulo (palabra por palabra) ---

let dialogueIntervalId: number | null = null;

function typeDialogue(text: string, targetSelector: string): void {
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

// --- entrada/salida del personaje ---
//
// El pasaporte NO usa este mecanismo: viaja en un arco parabolico propio, ver
// animatePassportAlongArc() mas abajo y su uso en renderVisitor()/resolveDecision().

type SlidableElement = { selector: string; restLeft: string };

const CHARACTER_ELEMENT: SlidableElement = { selector: "#character-portrait", restLeft: PORTRAIT_REST_LEFT };
const SLIDING_ELEMENTS: SlidableElement[] = [CHARACTER_ELEMENT];

function resetElementOffscreen(element: SlidableElement): void {
  const el = document.querySelector(element.selector) as HTMLElement | null;
  if (el === null) {
    return;
  }
  el.style.transition = "none";
  el.style.left = "130%";
  void el.offsetWidth; // fuerza el reflow para que el salto instantaneo se registre antes de reactivar la transicion
  el.style.transition = "";
  el.style.left = element.restLeft;
}

// los sellos ya no son <button>: son <div role="button"> arrastrables (ver
// setupStampDrag() mas abajo), asi que "disabled" no existe como propiedad -
// se simula con aria-disabled + pointer-events:none (ver .stamp-drag[aria-disabled]
// en style.css), un solo lugar para los 4 puntos del codigo que antes tocaban
// acceptBtn.disabled/rejectBtn.disabled directo.
function setDecisionStampsEnabled(enabled: boolean): void {
  const acceptBtn = document.querySelector("#accept-btn") as HTMLElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLElement | null;
  const alienBtn = document.querySelector("#alien-btn") as HTMLElement | null;
  [acceptBtn, rejectBtn, alienBtn].forEach(el => {
    if (el !== null) {
      el.setAttribute("aria-disabled", enabled ? "false" : "true");
    }
  });
}

function slideOutSlidingElements(direction: "left" | "right", onFinish: () => void): void {
  setDecisionStampsEnabled(false);

  SLIDING_ELEMENTS.forEach(({ selector }) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el === null) {
      return;
    }
    if (direction === "left") {
      el.style.left = "-70%";
    }
    if (direction === "right") {
      el.style.left = "130%";
    }
  });

  window.setTimeout(onFinish, PORTRAIT_ANIM_MS);
}

// --- arco parabolico del pasaporte (lanzado/devuelto a traves de la ventanilla) ---

// evaluador de una curva cubic-bezier(x1,y1,x2,y2), igual a la que usa CSS en
// animation-timing-function - si y2 > 1 el resultado pasa de 1 antes de
// asentarse (efecto de rebote/overshoot); PASSPORT_ARC_EASING no lo usa (y2
// no pasa de 1), es solo una desaceleracion suave, sin rebote
function createCubicBezierEasing(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  function onAxis(a1: number, a2: number, t: number): number {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * t * a1 + 3 * oneMinusT * t * t * a2 + t * t * t;
  }

  function derivativeOnAxis(a1: number, a2: number, t: number): number {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * a1 + 6 * oneMinusT * t * (a2 - a1) + 3 * t * t * (1 - a2);
  }

  return function easing(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const slope = derivativeOnAxis(x1, x2, t);
      if (Math.abs(slope) > 0.000001) {
        t = t - (onAxis(x1, x2, t) - x) / slope;
      }
    }
    return onAxis(y1, y2, t);
  };
}

type PassportPoint = { left: number; top: number; height: number };
type ControlPoint = { left: number; top: number };

// mueve #passport-object en una curva de bezier cuadratica (desde -> control ->
// hasta), con el tamaño interpolado con el mismo facilitador para que el rebote
// tambien se sienta en el "crecimiento" - queda con estilos inline al terminar,
// asi que alTerminar() es responsable de limpiarlos si hace falta.
//
// terminaEnElEscritorio indica la direccion (true = entrega, false = devolucion):
// el pasaporte solo va "al frente" (encima de la ventanilla/el escritorio) en el
// tramo del recorrido mas cercano al escritorio - el resto del arco (saliendo o
// volviendo hacia el personaje, y el pico) queda detras, ver PASSPORT_ARC_FRONT_THRESHOLD
function animatePassportAlongArc(
  from: PassportPoint,
  control: ControlPoint,
  to: PassportPoint,
  durationMs: number,
  easing: (t: number) => number,
  endsAtDesk: boolean,
  onFinish: () => void
): void {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null) {
    onFinish();
    return;
  }
  const el: HTMLElement = passportEl;

  el.style.transition = "none";
  // fija el z-index inicial ya (sincronico, antes del primer frame) en vez de
  // confiar en lo que haya quedado de una animacion anterior - si no, en la
  // primera entrega de la sesion (sin devolucion previa que lo deje "detras")
  // el z-index por defecto del CSS (5, al frente) queda aplicado hasta que
  // corre el primer requestAnimationFrame, y ese instante ya alcanza para que
  // se vea el pasaporte pasando por delante de la ventanilla al arrancar.
  el.style.zIndex = endsAtDesk ? PASSPORT_BEHIND_Z_INDEX : "";
  const startTime = performance.now();

  // para la entrega: en cuanto el "top" deja de subir (deja de acercarse a 0,
  // es decir ya curso el punto mas alto del arco) el pasaporte esta cayendo -
  // de ahi en mas siempre al frente, sin importar que tan alto este todavia
  // (ver comentario junto a PASSPORT_ARC_FRONT_THRESHOLD mas arriba)
  let minTopSeen = from.top;
  let pastPeak = false;

  function step(now: number): void {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const t = easing(progress);
    const oneMinusT = 1 - t;

    const left = oneMinusT * oneMinusT * from.left + 2 * oneMinusT * t * control.left + t * t * to.left;
    const top = oneMinusT * oneMinusT * from.top + 2 * oneMinusT * t * control.top + t * t * to.top;
    const height = from.height + (to.height - from.height) * t;

    el.style.left = left + "%";
    el.style.top = top + "%";
    el.style.height = height + "%";

    let inFront: boolean;
    if (endsAtDesk) {
      if (top > minTopSeen) {
        pastPeak = true;
      } else {
        minTopSeen = top;
      }
      inFront = pastPeak;
    } else {
      const approachingDesk = 1 - progress;
      inFront = approachingDesk >= PASSPORT_ARC_FRONT_THRESHOLD;
    }

    if (inFront) {
      el.style.zIndex = "";
    } else {
      el.style.zIndex = PASSPORT_BEHIND_Z_INDEX;
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      onFinish();
    }
  }

  window.requestAnimationFrame(step);
}

// --- tiempo limite del dia ---

let dayTimeoutId: number | null = null;

// si el temporizador del dia vence justo mientras se esta animando una
// decision (resolveDecision(), ver mas abajo - tarda ~2s en total: sello,
// cierre, arco de vuelta, salida del personaje), no hay que cortarla a la
// mitad: eso generaba dos caminos llegando a afterDecision() casi juntos (el
// del timer y el de la decision en curso), cada uno eligiendo una Jefa al
// azar - por eso se veia "cambiar de golpe" en la pantalla de resultado del
// dia. En vez de eso, se marca que el dia debe cerrarse, y se cierra recien
// cuando esa decision termina de procesar (ver el final de resolveDecision()).
let resolvingDecision = false;
let dayEndsOnRelease = false;

// true mientras se muestra la reaccion de la Jefa por un error (ver
// showErrorReaction() mas abajo) - #continue-day-btn la revisa para saber si
// tiene que volver al visitante siguiente en vez de arrancar un dia nuevo
let errorReactionPending = false;

// tiempo total ya transcurrido del dia (acumulado a traves de pausas) y el
// instante en que arranco el tramo que esta corriendo ahora mismo (null =
// pausado/detenido) - separados asi (en vez de un solo timestamp de inicio)
// para poder pausar el dia entero (ver pauseDayTimer()/resumeDayTimer() mas
// abajo, usadas por las pantallas de reaccion de la Jefa por error) sin
// perder cuenta de cuanto tiempo real ya paso.
let dayElapsedMs = 0;
let dayResumedAt: number | null = null;

// instante en que se habilito decidir sobre el pasaporte actual (ver el click
// de #passport-object mas abajo, que llama setDecisionStampsEnabled(true)) -
// null mientras el pasaporte esta cerrado. Se usa en resolveDecision() para
// detectar si el jugador decidio demasiado rapido como para haberlo revisado
// de verdad (ver RUSH_THRESHOLD_MS y Game.decide(), parametro wasRushed).
let passportOpenedAt: number | null = null;
const RUSH_THRESHOLD_MS = 700;

function currentDayElapsedMs(): number {
  if (dayResumedAt === null) {
    return dayElapsedMs;
  }
  return dayElapsedMs + (performance.now() - dayResumedAt);
}

function clearDayTimer(): void {
  if (dayTimeoutId !== null) {
    clearTimeout(dayTimeoutId);
    dayTimeoutId = null;
  }
  stopDayClock();
  dayElapsedMs = 0;
  dayResumedAt = null;
}

// --- reloj de arena del dia (reemplaza la barra de tiempo por visitante de antes) ---
//
// 4 etapas (full/medio/casi/vacio) repartidas en partes iguales del tiempo del
// dia, cada una alternando entre sus 2 cuadros (mismo criterio que
// COIN_SPIN_FRAMES) para dar sensacion de movimiento; al quedar <=3s (o
// vencer) pasa a "broken". Corre en un intervalo aparte (no un solo setTimeout
// como el dia): a diferencia de la barra vieja (CSS puro, animationDuration)
// esto necesita re-evaluar la etapa/cuadro/parpadeo a cada rato.
const CLOCK_FRAME_MS = 450;
const CLOCK_TICK_MS = 200;
const CLOCK_BROKEN_THRESHOLD_MS = 3000;

let clockIntervalId: number | null = null;

// solo detiene el intervalo visual (deja el reloj congelado en su ultimo
// cuadro) - no toca dayElapsedMs/dayResumedAt, eso lo maneja quien pause/pare
// el dia de verdad (pauseDayTimer()/clearDayTimer())
function stopDayClock(): void {
  if (clockIntervalId !== null) {
    window.clearInterval(clockIntervalId);
    clockIntervalId = null;
  }
}

function startDayClock(): void {
  stopDayClock();
  updateDayClock();
  clockIntervalId = window.setInterval(updateDayClock, CLOCK_TICK_MS);
}

function updateDayClock(): void {
  const clockEl = document.querySelector("#day-clock") as HTMLElement | null;
  if (clockEl === null) {
    return;
  }

  const elapsed = currentDayElapsedMs();
  const remaining = Math.max(DAY_DURATION_MS - elapsed, 0);
  const dayQuarter = DAY_DURATION_MS / 4;

  const frame = Math.floor(elapsed / CLOCK_FRAME_MS) % 2 === 0 ? "frame-a" : "frame-b";

  let stage: string;
  if (remaining <= CLOCK_BROKEN_THRESHOLD_MS) {
    stage = "broken";
  } else if (remaining <= dayQuarter) {
    stage = "stage-empty";
  } else if (remaining <= dayQuarter * 2) {
    stage = "stage-almost";
  } else if (remaining <= dayQuarter * 3) {
    stage = "stage-half";
  } else {
    stage = "stage-full";
  }

  clockEl.classList.remove("stage-full", "stage-half", "stage-almost", "stage-empty", "broken", "frame-a", "frame-b", "pulse-light", "pulse-strong");
  clockEl.classList.add(stage);
  if (stage !== "broken") {
    clockEl.classList.add(frame);
  }

  // parpadeo leve desde la segunda mitad de "casi" en adelante, fuerte recien
  // con el reloj roto y una decision todavia en curso (ver resolviendoDecision) -
  // efecto chico a proposito, no debe interrumpir la pantalla
  if (stage === "broken") {
    if (resolvingDecision) {
      clockEl.classList.add("pulse-strong");
    }
  } else if (stage === "stage-empty" || (stage === "stage-almost" && remaining <= dayQuarter * 2.5)) {
    clockEl.classList.add("pulse-light");
  }
}

function onDayTimerExpire(): void {
  if (game === null) {
    return;
  }
  if (resolvingDecision) {
    dayEndsOnRelease = true;
    return;
  }
  const dayBefore = game.dayNumber;
  game.endDay();
  afterDecision(dayBefore);
}

// arranca una sola vez por dia (no por visitante, ver los dos lugares donde se
// llama: el listener de #continue-day-btn y el de #continue-btn) - mientras
// corre, los visitantes se suceden sin reiniciarlo (ver renderVisitor() y
// resolveDecision(), que ya no lo tocan). Al vencer, termina el dia entero,
// haya o no un visitante a medio decidir en pantalla.
function startDayTimer(): void {
  clearDayTimer();

  const clockEl = document.querySelector("#day-clock") as HTMLElement | null;
  if (!timerEnabled) {
    if (clockEl !== null) {
      clockEl.classList.add("hidden");
    }
    return;
  }
  if (clockEl !== null) {
    clockEl.classList.remove("hidden");
  }

  if (game === null) {
    return;
  }

  dayResumedAt = performance.now();
  startDayClock();
  dayTimeoutId = window.setTimeout(onDayTimerExpire, DAY_DURATION_MS);
}

// pausa el dia entero (temporizador + reloj visual, que queda congelado en su
// ultimo cuadro) sin perder el tiempo ya transcurrido - usada mientras se
// muestra una pantalla de reaccion de la Jefa por error (ver
// showErrorReaction()), para que leerla no le robe tiempo al jugador.
function pauseDayTimer(): void {
  if (dayResumedAt === null) {
    return; // ya estaba pausado (o el dia nunca arranco), nada que hacer
  }
  if (dayTimeoutId !== null) {
    clearTimeout(dayTimeoutId);
    dayTimeoutId = null;
  }
  dayElapsedMs = currentDayElapsedMs();
  dayResumedAt = null;
  stopDayClock();
}

// reanuda un dia pausado con pauseDayTimer() - re-programa el cierre del dia
// con el tiempo REAL que queda (no el dia entero de nuevo)
function resumeDayTimer(): void {
  if (!timerEnabled || game === null || dayResumedAt !== null) {
    return;
  }
  dayResumedAt = performance.now();
  startDayClock();
  const remainingMs = Math.max(DAY_DURATION_MS - dayElapsedMs, 0);
  dayTimeoutId = window.setTimeout(onDayTimerExpire, remainingMs);
}

function renderVisitor(): void {
  if (game === null || game.currentVisitor === null) {
    return;
  }

  resetElementOffscreen(CHARACTER_ELEMENT);

  // por si quedaba un resaltado de la pista de la tienda sin terminar de
  // apagarse (ver #shop-hint-btn) - no tiene sentido sobre el visitante nuevo
  document.querySelectorAll(".hint-highlight").forEach(el => el.classList.remove("hint-highlight"));

  // se mantienen deshabilitados hasta que el jugador abra el pasaporte (ver el
  // listener de click de #passport-object) - no se puede decidir a ciegas
  setDecisionStampsEnabled(false);

  // el sello azul no existe sobre el escritorio hasta el dia en que empieza a
  // hacer falta (ver reglas.json, propiedad "selloAlien") - antes de eso ni
  // siquiera se ve, para no confundir con una tercera opcion que no aplica
  const alienStampEl = document.querySelector("#alien-btn") as HTMLElement | null;
  if (alienStampEl !== null) {
    alienStampEl.classList.toggle("hidden", !game.alienStampRuleActive());
  }

  const visitor = game.currentVisitor;
  const passport = visitor.obtainPassport;

  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  const decisionStampEl = document.querySelector("#decision-stamp") as HTMLElement | null;
  if (decisionStampEl !== null) {
    decisionStampEl.classList.remove("show", "approved", "rejected", "alien");
  }
  if (passportEl !== null) {
    // se esconde del todo (todavia no lo "lanzo") - nada de dejarlo chiquito
    // pero visible: eso es lo que se quedaba pegado en la ventanilla despues
    // de devolverse
    passportEl.style.display = "none";
    passportEl.classList.remove("open", "delivered", ...PASSPORT_DESK_LOOK_VARIANTS);
    passportEl.classList.add("closed");
  }
  passportOpenedAt = null;

  window.setTimeout(() => {
    if (passportEl !== null) {
      // se lanza: arco parabolico desde la base del personaje, a traves de la
      // ventanilla (el punto de control tira la curva bien arriba), cayendo
      // sobre el escritorio
      passportEl.style.display = "";
      passportEl.style.left = PASSPORT_ARC_BASE.left + "%";
      passportEl.style.top = PASSPORT_ARC_BASE.top + "%";
      passportEl.style.height = PASSPORT_ARC_BASE.height + "%";

      animatePassportAlongArc(PASSPORT_ARC_BASE, PASSPORT_ARC_CONTROL, PASSPORT_ARC_DESK, PASSPORT_ARC_MS, PASSPORT_ARC_EASING, true, () => {
        // "aterrizo": limpia los estilos inline (los valores de la clase
        // .cerrado ya coinciden con PASSPORT_ARC_DESK, asi que no se mueve
        // nada) y cambia a una de las 3 variantes "apoyado en la mesa" al azar
        // - todo esto TODAVIA con la transicion apagada (animatePassportAlongArc
        // la dejo en "none"), asi que el cambio de imagen es directo, sin
        // animar. Recien despues se reactiva la transicion, para que abrir con
        // el click (mas abajo) sí se sienta suave.
        passportEl.style.left = "";
        passportEl.style.top = "";
        passportEl.style.height = "";
        const variant = PASSPORT_DESK_LOOK_VARIANTS[Math.floor(Math.random() * PASSPORT_DESK_LOOK_VARIANTS.length)];
        passportEl.classList.add(variant);
        passportEl.classList.add("delivered");
        passportEl.style.transition = "";
      });
    }
  }, PORTRAIT_ANIM_MS + PASSPORT_DELIVERY_DELAY_MS);

  const nameEl = document.querySelector("#passport-name");
  const regionEl = document.querySelector("#passport-region");
  const specieEl = document.querySelector("#passport-species");
  const passportStampEl = document.querySelector("#passport-stamp");

  if (nameEl !== null) nameEl.textContent = passport.obtainName;
  if (regionEl !== null) regionEl.textContent = passport.obtainRegion;
  if (passportStampEl !== null) passportStampEl.className = passport.obtainStamp;

  // visible desde el dia 1 (antes se ocultaba hasta el dia 4, que es cuando
  // arranca a importar para alguna regla) - se muestra ya de entrada para que
  // el jugador se acostumbre a leer el dato antes de que dependa de el
  if (specieEl !== null) {
    (specieEl as HTMLElement).style.display = "";
    specieEl.textContent = passport.obtainDeclaredSpecie;
  }

  typeDialogue(visitor.dialogueLine(), "#dialogue-bubble");

  const faceEl = document.querySelector(".part-face");
  const eyesEl = document.querySelector(".part-eyes");
  const mouthEl = document.querySelector(".part-mouth");
  const hairEl = document.querySelector(".part-hair");
  const hornsEl = document.querySelector(".part-horns") as HTMLElement | null;

  if (faceEl !== null) faceEl.className = "part part-face " + visitor.obtainFace;
  if (eyesEl !== null) {
    const eyesVariant = visitor.obtainYellowEyes ? "yellowEyes" : visitor.obtainEyes;
    eyesEl.className = "part part-eyes " + eyesVariant;
  }
  if (mouthEl !== null) mouthEl.className = "part part-mouth " + visitor.obtainMouth;
  if (hairEl !== null) hairEl.className = "part part-hair " + visitor.obtainHair;

  if (hornsEl !== null) {
    if (visitor.obtainHaveHorns) {
      hornsEl.className = "part part-horns " + visitor.obtainHorns;
      hornsEl.style.display = "";
    } else {
      hornsEl.style.display = "none";
    }
  }

  // "DÍA"/"ERRORES"/"RACHA" ya estan dibujados dentro de fondoPantallaJuegoT.png
  // (ver style.css #hud) - aca solo se ponen los valores, no el texto completo
  const dayEl = document.querySelector("#day-counter");
  const errorsEl = document.querySelector("#error-counter") as HTMLElement | null;
  const moneyEl = document.querySelector("#money-counter");
  const streakEl = document.querySelector("#streak-counter");
  const sceneEl = document.querySelector("#character-scene") as HTMLElement | null;

  if (dayEl !== null) dayEl.textContent = game.dayNumber + " / " + game.totalDays;
  if (errorsEl !== null) {
    errorsEl.textContent = game.errors + " / 4";
    if (game.errors >= 3) {
      errorsEl.classList.add("danger");
    } else {
      errorsEl.classList.remove("danger");
    }
  }
  // modo alerta: con 3+ errores, el recuadro solido detras de fondoPantallaJuegoT.png
  // (ver style.css .alerta) empieza a parpadear en rosa, lo que se lee como todo
  // el borde de la pantalla en alerta - de momento solo visual, ver docs/ideas.md
  // para un futuro "modo reducir errores"
  if (sceneEl !== null) {
    if (game.errors >= 3) {
      sceneEl.classList.add("alert");
    } else {
      sceneEl.classList.remove("alert");
    }
  }
  if (moneyEl !== null) moneyEl.textContent = "Dinero: " + game.money;
  if (streakEl !== null) streakEl.textContent = String(streak);
}

function afterDecision(dayBefore: number): void {
  if (game === null) {
    return;
  }

  // una partida cortada por errores no "termina el dia" de verdad - va
  // directo al final, sin pasar por el resumen de dia (ver isWon() mas abajo,
  // que SI pasa por el resumen: el dia 7 completo se resume igual que
  // cualquier otro dia, antes de ir a la pantalla final)
  if (game.isLost()) {
    clearDayTimer();
    dayStreaks.push(streak);
    saveDayStreaks(dayStreaks);
    renderFinalScreen();
    changeState("final");
    return;
  }

  if (game.dayNumber > dayBefore) {
    clearDayTimer();
    const dayMaxStreak = Math.max(maxStreakToday, streak);
    dayStreaks.push(streak);
    saveDayStreaks(dayStreaks);
    streak = 0; // la racha arranca de nuevo en cada dia (ver docs/ideas.md)
    maxStreakToday = 0;
    changeState("day-summary"); // primero cambia de pantalla para que no corte el audio de abajo
    renderDaySummaryScreen(dayBefore, dayMaxStreak);
    return;
  }

  renderVisitor();
}

// --- reaccion de la Jefa por error (1ro/2do/3ro del dia) ---
//
// "throughReaction" = el jugador dejo pasar a alguien que debia rechazar
// (accept=true, error) - "rejectedReaction" = rechazo a alguien que debia
// aceptar (accept=false, error). El 4to error ya termina la partida sola
// (isLost()), no necesita reaccion propia - ver el chequeo en resolveDecision().
const ERROR_REACTIONS: Record<number, { throughReaction: StoryBeat; rejectedReaction: StoryBeat }> = {
  1: {
    throughReaction: { image: "jefaEnojo2", text: "Oye, te dije que no dejaras pasar ningún yokai prohibido." },
    rejectedReaction: { image: "jefaDecepcion", text: "¿Qué haces rechazando espíritus permitidos? Me haces perder dinero." },
  },
  2: {
    throughReaction: { image: "jefaGolpea", text: "No volveré a repetirlo, ¡NO ENTRAN YOKAIS QUE ROMPAN LAS NORMAS!" },
    rejectedReaction: { image: "jefaAsustada", text: "¡Cada vez pierdo más dinero por ti! ¿ACASO MENTISTE SOBRE TU EXPERIENCIA?" },
  },
  3: {
    throughReaction: { image: "jefaKatana", text: "¡AAAAAAAH, ME TIENES HARTAAAA!" },
    rejectedReaction: { image: "jefaEnojo", text: "¡Esta vez eso saldrá de tu sueldo! Quedas amonestado." },
  },
};

function showErrorReaction(accept: boolean, errorNumber: number): void {
  const reactions = ERROR_REACTIONS[errorNumber];
  if (reactions === undefined) {
    return;
  }
  setNoticeType("error");
  soundManager.playWrite(); // sonido de escritura mientras aparece el texto de la jefa por error
  renderJefaBeat(accept ? reactions.throughReaction : reactions.rejectedReaction);
  errorReactionPending = true;
  pauseDayTimer();
  changeState("day-result");
}

// usedAlienStamp = se aprobo con el sello AZUL (el de los alien, desde el dia 6)
// en vez del verde de siempre - ver Game.decide() y setupStampDrag()
function resolveDecision(accept: boolean, usedAlienStamp: boolean = false): void {
  if (game === null) {
    return;
  }
  // se mide ACA (apenas el jugador suelta el sello), no mas abajo cuando recien
  // se llama a game.decide() - esa llamada esta atras de ~2s de animacion, no
  // del tiempo que el jugador realmente tardo en revisar el pasaporte
  const wasRushed = passportOpenedAt !== null && (performance.now() - passportOpenedAt) < RUSH_THRESHOLD_MS;

  // ojo: NO se toca el temporizador aca - es por dia, no por visitante, tiene
  // que seguir corriendo mientras se decide (ver startDayTimer()). Se marca
  // que hay una decision en curso para que, si el dia vence en el medio, no
  // se corte a la mitad (ver diaTerminaAlSoltar mas abajo y en startDayTimer()).
  resolvingDecision = true;

  const dayBefore = game.dayNumber;
  const errorsBefore = game.errors;
  const direction = accept ? "left" : "right";

  setDecisionStampsEnabled(false);

  const decisionStampEl = document.querySelector("#decision-stamp") as HTMLElement | null;
  if (decisionStampEl !== null) {
    let stampLook = accept ? "approved" : "rejected";
    if (usedAlienStamp) {
      stampLook = "alien";
    }
    decisionStampEl.className = "show " + stampLook;
  }

  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;

  // se ve el sello un instante sobre el pasaporte todavia abierto; despues se
  // cierra en el sitio (el sello placeholder desaparece con el), y recien
  // ahi se devuelve - mismo arco de la entrega pero al reves, terminando
  // escondido del todo (no se queda pegado, chico, en la ventanilla). El
  // personaje sale por separado, con el mecanismo de siempre.
  window.setTimeout(() => {
    if (decisionStampEl !== null) {
      decisionStampEl.classList.remove("show", "approved", "rejected", "alien");
    }
    if (passportEl !== null) {
      // vuelve a pasaporte.png (saca la variante "en la mesa" si tenia una):
      // se devuelve mostrando el mismo aspecto con el que se entrego
      passportEl.classList.remove("open", "delivered", ...PASSPORT_DESK_LOOK_VARIANTS);
      passportEl.classList.add("closed");
    }

    window.setTimeout(() => {
      animatePassportAlongArc(PASSPORT_ARC_DESK, PASSPORT_ARC_CONTROL, PASSPORT_ARC_BASE, PASSPORT_ARC_MS, PASSPORT_ARC_EASING, false, () => {
        if (passportEl !== null) {
          passportEl.style.left = "";
          passportEl.style.top = "";
          passportEl.style.height = "";
          passportEl.style.display = "none";
          // reactiva la transicion (animatePassportAlongArc la deja en "none")
          // para que el proximo visitante abra/cierre el pasaporte con la
          // animacion "en el sitio" normal, no de golpe
          passportEl.style.transition = "";
        }

        slideOutSlidingElements(direction, () => {
          resolvingDecision = false;
          if (game === null) {
            return;
          }
          game.decide(accept, usedAlienStamp, wasRushed);

          const justErred = game.errors > errorsBefore;
          if (justErred) {
            streak = 0;
            // si este error hace perder la partida, NO suena el error: solo
            // el sonido de derrota (ver playLose() en renderFinalScreen())
            if (!game.isLost()) {
              soundManager.playWrong();
            }
          } else {
            streak += 1;
            if (streak > maxStreakToday) {
              maxStreakToday = streak;
            }
          }

          // el dia vencio mientras se animaba esta decision (ver startDayTimer()):
          // recien ahora, con el visitante que el jugador realmente vio ya
          // procesado, se cierra el dia - salvo que decide() ya haya terminado
          // la partida sola (perdio/gano), en cuyo caso no corresponde avanzar.
          if (dayEndsOnRelease) {
            dayEndsOnRelease = false;
            if (!game.isLost() && !game.isWon()) {
              game.endDay();
            }
          }

          // reaccion de la Jefa por error (1ro/2do/3ro - el 4to ya termino la
          // partida arriba, isLost() corta esto solo): solo tiene sentido si
          // se sigue jugando el MISMO dia, ni con la partida recien perdida/
          // ganada ni con el dia recien cerrado por el temporizador (esos
          // casos ya los resuelve afterDecision() con su propia pantalla)
          if (justErred && !game.isLost() && !game.isWon() && game.dayNumber === dayBefore) {
            showErrorReaction(accept, game.errors);
            return;
          }

          afterDecision(dayBefore);
        });
      });
    }, PASSPORT_ANIM_MS);
  }, DECISION_STAMP_FLASH_MS);
}

// --- sellos: drag and drop real (reemplazan los botones Aceptar/Rechazar) ---
//
// 3 imagenes por sello (ver public/img/sellos/): pos1 en reposo sobre el
// escritorio, pos2 mientras se arrastra, pos3 al acercarse/soltar sobre el
// pasaporte (esa es la que dispara la decision). Al soltar el mouse en
// cualquier lado, siempre vuelve solo a pos1 en su posicion inicial - eso lo
// hace solo la transicion de left/top/height de .stamp-drag en style.css en
// cuanto se saca la clase .arrastrando (que la apaga durante el arrastre para
// que siga al mouse sin retraso).
// OJO: estos valores tienen que coincidir con el "left"/"top" que cada sello
// tiene en style.css - el CSS los coloca al cargar la pagina, y returnToRest()
// los vuelve a poner despues de cada arrastre. Si se cambia uno solo, el sello
// aparece en un lado y "vuelve" a otro (paso con el azul al moverlo a 29%).
const STAMP_REST_POSITION: Record<string, { left: number; top: number }> = {
  "alien-btn": { left: 29, top: 78 },
  "reject-btn": { left: 80, top: 78 },
  "accept-btn": { left: 91, top: 78 },
};

// que tan cerca del pasaporte (en px de pantalla, expandiendo su propio
// rectangulo) cuenta como "acercandolo" - bastante generoso a proposito, el
// pasaporte es chico y no hace falta puntería quirúrgica
const STAMP_DROP_MARGIN_PX = 60;

function isNearPassport(clientX: number, clientY: number): boolean {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null || !passportEl.classList.contains("open")) {
    return false;
  }
  const rect = passportEl.getBoundingClientRect();
  return (
    clientX >= rect.left - STAMP_DROP_MARGIN_PX &&
    clientX <= rect.right + STAMP_DROP_MARGIN_PX &&
    clientY >= rect.top - STAMP_DROP_MARGIN_PX &&
    clientY <= rect.bottom + STAMP_DROP_MARGIN_PX
  );
}

// usedAlienStamp: true solo para el sello azul, el que aprueba a los alien desde
// el dia 6 (ver Game.decide()). Los otros dos lo dejan en false y se comportan
// exactamente igual que antes.
function setupStampDrag(id: string, accept: boolean, usedAlienStamp: boolean = false): void {
  const stampEl = document.querySelector("#" + id) as HTMLElement | null;
  const sceneEl = document.querySelector("#character-scene") as HTMLElement | null;
  const rest = STAMP_REST_POSITION[id];
  if (stampEl === null || sceneEl === null || rest === undefined) {
    return;
  }

  function returnToRest(): void {
    if (stampEl === null) return;
    stampEl.classList.remove("dragging", "pos2", "pos3");
    stampEl.classList.add("pos1");
    stampEl.style.left = rest.left + "%";
    stampEl.style.top = rest.top + "%";
    stampEl.style.height = "";
  }

  function move(clientX: number, clientY: number): void {
    if (stampEl === null || sceneEl === null) return;
    const sceneRect = sceneEl.getBoundingClientRect();
    const left = ((clientX - sceneRect.left) / sceneRect.width) * 100;
    const top = ((clientY - sceneRect.top) / sceneRect.height) * 100;
    stampEl.style.left = Math.min(Math.max(left, 2), 98) + "%";
    stampEl.style.top = Math.min(Math.max(top, 2), 98) + "%";

    stampEl.classList.remove("pos2", "pos3");
    stampEl.classList.add(isNearPassport(clientX, clientY) ? "pos3" : "pos2");
  }

  stampEl.addEventListener("pointerdown", (event: PointerEvent) => {
    if (stampEl.getAttribute("aria-disabled") === "true") {
      return;
    }
    stampEl.setPointerCapture(event.pointerId);
    stampEl.classList.add("dragging");
    move(event.clientX, event.clientY);
  });

  stampEl.addEventListener("pointermove", (event: PointerEvent) => {
    if (!stampEl.classList.contains("dragging")) {
      return;
    }
    move(event.clientX, event.clientY);
  });

  stampEl.addEventListener("pointerup", (event: PointerEvent) => {
    if (!stampEl.classList.contains("dragging")) {
      return;
    }
    const droppedNearPassport = isNearPassport(event.clientX, event.clientY);
    returnToRest();
    if (droppedNearPassport) {
      // sonido del sello al soltarlo sobre el pasaporte: verde = aceptar, rojo = rechazar
      accept ? soundManager.playAccept() : soundManager.playReject();
      resolveDecision(accept, usedAlienStamp);
    }
  });

  // activar/desactivar aria-disabled ya alcanza para que el mouse no arranque
  // el arrastre (ver el chequeo al principio de pointerdown), pero el teclado
  // (Enter/Espacio) no dispara pointerdown - se agrega un atajo directo, sin
  // arrastre, equivalente al viejo click del <button>
  stampEl.addEventListener("keydown", (event: KeyboardEvent) => {
    if (stampEl.getAttribute("aria-disabled") === "true") {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resolveDecision(accept, usedAlienStamp);
    }
  });
}

setupStampDrag("reject-btn", false);
setupStampDrag("accept-btn", true);
setupStampDrag("alien-btn", true, true);

// el pasaporte no se abre solo: el jugador tiene que clickearlo una vez que el
// personaje ya se lo entrego (clase "delivered", ver renderVisitor()); recien
// ahi se habilitan aceptar/rechazar - no se puede decidir sin haberlo abierto
document.querySelector("#passport-object")?.addEventListener("click", () => {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null) {
    return;
  }
  if (!passportEl.classList.contains("closed") || !passportEl.classList.contains("delivered")) {
    return;
  }
  soundManager.playPaperFlip(); // sonido de hoja al abrir el pasaporte
  passportEl.classList.remove("delivered");
  window.setTimeout(() => {
    passportEl.classList.remove("closed");
    passportEl.classList.add("open");
    setDecisionStampsEnabled(true);
    passportOpenedAt = performance.now();
  }, PASSPORT_OPEN_DELAY_MS);
});

// --- Day summary screen (resumen narrativo + estadisticas al terminar cada dia) ---

const DAY_END_MESSAGES: string[] = [
  "Ha finalizado el día. Vas camino a casa, feliz con tu nuevo empleo.",
  "Ha finalizado tu jornada. Ahora ves que se te está exigiendo más... te duelen los pies y las manos de tanto sellar.",
  "Final de la jornada. Ahora no puedes esperar para estar en casa, llorar un poco y dormir... mucha suerte.",
  "Final de la jornada. Hoy no estás tan agotado... además, la Jefa te ha hecho un cumplido, te sientes afortunado.",
  "Fin de la jornada... tratas de convencerte de que la paga es buena... aunque realmente no lo es...",
  "Jornada de trabajo terminada... día agotador, pero te tranquiliza la idea de que solo te quedan 45 años para jubilarte... suerte.",
  "Fin del día 7... buen trabajo.",
];

function renderDaySummaryScreen(dayNumber: number, maxStreak: number): void {
  if (game === null) {
    return;
  }
  const numberEl = document.querySelector("#day-summary-number");
  if (numberEl !== null) {
    numberEl.textContent = String(dayNumber);
  }
  typeDialogue(DAY_END_MESSAGES[dayNumber - 1], "#day-summary-text");

  const statsEl = document.querySelector("#day-summary-stats");
  if (statsEl === null) {
    return;
  }
  statsEl.innerHTML = "";
  const money = game.lastDayMoney;
  const charge = game.lastDayCharge;
  const rushPenalty = game.lastDayRushPenalty;
  const stats = [
    "Aceptados: " + game.lastDayAccepted,
    "Rechazados: " + game.lastDayRejected,
    "Errores: " + game.lastDayErrors,
    "Racha máxima: " + maxStreak,
    "Dinero ganado: " + (money >= 0 ? "+" : "") + money,
  ];
  // el dia 1 no tiene cobro diario (ver Game.#chargeDailyCost()), no mostrar la
  // linea si no hubo cobro
  if (charge > 0) {
    stats.push("Cobro diario: -" + charge);
  }
  // solo aparece si hubo al menos una decision demasiado rapida ese dia (ver
  // RUSH_THRESHOLD_MS)
  if (rushPenalty > 0) {
    stats.push("Descuido (decidiste sin revisar): -" + rushPenalty);
  }
  stats.forEach(line => {
    const item = document.createElement("li");
    item.textContent = line;
    statsEl.appendChild(item);
  });
}

document.querySelector("#day-summary-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  if (game === null) {
    return;
  }
  if (game.isWon()) {
    renderFinalScreen();
    changeState("final");
    return;
  }
  changeState("day-result"); // primero cambia de pantalla para que no corte el audio de abajo
  renderDayResultScreen();
});

// --- Day result screen ---

function renderDayResultScreen(showSummary: boolean = true): void {
  if (game === null) {
    return;
  }

  const summaryEl = document.querySelector("#day-result-summary");
  const messageEl = document.querySelector("#next-day-message");

  if (summaryEl !== null) {
    const summaryHtmlEl = summaryEl as HTMLElement;
    if (showSummary) {
      summaryHtmlEl.classList.remove("hidden");
      summaryEl.textContent = "Errores acumulados: " + game.errors + " / 4 — Dinero: " + game.money;
    } else {
      summaryHtmlEl.classList.add("hidden");
    }
  }
  const jefaEl = document.querySelector("#jefa-portrait");
  if (jefaEl !== null) {
    const variant = JEFA_EXPLICA_VARIANTS[Math.floor(Math.random() * JEFA_EXPLICA_VARIANTS.length)];
    jefaEl.className = variant;
  }

  if (messageEl !== null) {
    setNoticeType("rule");
    typeDialogue(game.currentDay.getIntroMessage(), "#next-day-message");
  }
}

// 3 modos posibles, revisados en orden: en medio de la intro del dia 1 (avanza
// el cuadro, o pasa a la pantalla de reglas activas si ya era el ultimo),
// reaccion de la Jefa por un error (vuelve al visitante siguiente, SIN
// reiniciar el temporizador del dia - sigue corriendo igual que durante
// resolveDecision()), o el paso normal entre dias (pasa a la pantalla de
// reglas activas antes de arrancar el dia nuevo).
document.querySelector("#continue-day-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  soundManager.stopWrite(); // corta el sonido de escritura si todavia estaba sonando
  if (introBeatIndex !== null) {
    introBeatIndex += 1;
    if (introBeatIndex < DAY_ONE_INTRO_BEATS.length) {
      setNoticeType("rule");
      renderJefaBeat(DAY_ONE_INTRO_BEATS[introBeatIndex]);
      return;
    }
    introBeatIndex = null;
    changeState("day-start");
    renderDayStartScreen();
    return;
  }

  if (errorReactionPending) {
    errorReactionPending = false;
    changeState("game");
    renderVisitor();
    resumeDayTimer();
    return;
  }

  changeState("day-start");
  renderDayStartScreen();
});

// --- Day start screen (reglas activas del dia, antes de arrancar a jugar) ---

function renderDayStartScreen(): void {
  if (game === null) {
    return;
  }
  const numberEl = document.querySelector("#day-start-number");
  if (numberEl !== null) {
    numberEl.textContent = game.dayNumber + " / " + game.totalDays;
  }
  const rulesEl = document.querySelector("#day-start-rules");
  if (rulesEl === null) {
    return;
  }
  rulesEl.innerHTML = "";
  game.currentDay.getActiveRules().forEach(rule => {
    const item = document.createElement("li");
    item.textContent = rule.getDescription();
    rulesEl.appendChild(item);
  });
}

document.querySelector("#day-start-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  changeState("game");
  renderVisitor();
  startDayTimer();
});

// --- Final screen ---
//
// Cada cuadro ("beat") define que clase le pone a #final-backdrop, a
// #final-portrait (null = sin personaje encima, solo el backdrop) y a
// #final-award (null = no es un premio) - #final-continue-btn solo se muestra
// si todavia queda otro cuadro despues del actual.
//
// La partida termina con: un final (uno solo, ver renderFinalScreen()) seguido
// de los premios que se haya ganado, de a uno (ver buildAwardBeats()).
type EndingBeat = { backdrop: string; portrait: string | null; award: string | null; text: string };

const ENDING_DEFEAT: EndingBeat[] = [
  { backdrop: "defeat", portrait: null, award: null, text: "Te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo." },
];

const ENDING_WIN_REGULAR: EndingBeat[] = [
  { backdrop: "win-regular", portrait: null, award: null, text: "Tu desempeño ha sido regular en la agencia, pero lo suficientemente bueno para ser ascendido y obtener una oficina nueva sin ventanas, aunque crees que te pagarán más, solo es mucho papeleo por la misma paga." },
  { backdrop: "blurred-office", portrait: "protaDepre", award: null, text: "Aunque lograste salvar al mundo y eso debería ser suficiente... felicitaciones, supongo..." },
];

const ENDING_WIN_SPECIAL: EndingBeat[] = [
  { backdrop: "blurred-office", portrait: "jefaTeAma", award: null, text: "Has hecho un trabajo tan eficiente que la jefa se ha enamorado de ti... ella y la agencia han ganado mucho dinero por tu desempeño, eres tan bueno que no puedes ser ascendido y deciden quedarse solo contigo y despedir a los otros trabajadores... recibes un aumento de 2 monedas más al mes... felicidades...." },
];

// perder 3 partidas SEGUIDAS (ver addResultToStreak en Storage.ts): las dos
// primeras derrotas muestran el final normal, la tercera este
const ENDING_YOKAI: EndingBeat[] = [
  { backdrop: "yokai", portrait: null, award: null, text: "Has perdido demasiadas veces consecutivas, te conviertes en yokai y eres tú quien desata el apocalipsis... la jefa llora porque te amaba en secreto... GAME OVER" },
  { backdrop: "yokai", portrait: null, award: null, text: "Del otro lado del mostrador ya no queda nada tuyo: la agencia borró tu expediente completo. Se eliminaron TODAS las partidas guardadas." },
];

// ganar 3 partidas SEGUIDAS
const ENDING_BOSS: EndingBeat[] = [
  { backdrop: "boss", portrait: null, award: null, text: "Has ascendido a jefe... a la inspectora la han degradado a tu puesto... finalmente la vida te sonríe." },
  { backdrop: "boss-worried", portrait: null, award: null, text: "La antigua jefa no puede mantener su lujoso estilo de vida con su nuevo sueldo.... FIN" },
];

// ganar con mucho dinero acumulado (ver RICH_BOSS_MONEY)
const ENDING_RICH_BOSS: EndingBeat[] = [
  { backdrop: "rich-boss", portrait: null, award: null, text: "Lo has hecho muy bien... Tan bien que la jefa ahora gana mucho dinero y puede permitirse la vida que siempre soñó!... a ti... te dan un pequeño bono al final del año... siempre tienes hambre... FIN?" },
];

// cuantas partidas seguidas con el mismo resultado hacen falta para los finales
// de "te convertiste en yokai" / "sos el jefe"
const CONSECUTIVE_FOR_SPECIAL_ENDING = 3;

// cuanto dinero hay que terminar la partida para el final de la jefa millonaria -
// bien por encima de una partida normal de 7 dias (100-200 monedas con +2 por
// acierto), para que haga falta jugar rapido y arriesgado de verdad.
const RICH_BOSS_MONEY = 300;

// premios de fin de partida: se muestran de a uno despues del final, gane o
// pierda. La imagen es la clase de #final-award (ver public/img/animaciones/).
function awardBeat(award: string, text: string): EndingBeat {
  return { backdrop: "blurred-office", portrait: null, award: award, text: text };
}

// los tres premios de "no se te paso ninguno" piden ademas haber llegado al dia
// en que esa criatura empieza a aparecer (Oni dia 1, Kitsune dia 2, Kappa dia
// 3): sin eso los ganaria de arriba cualquiera que pierda el primer dia, porque
// nunca vio uno.
function buildAwardBeats(): EndingBeat[] {
  if (game === null) {
    return [];
  }
  const beats: EndingBeat[] = [];
  if (game.daysCompleted >= 3) {
    beats.push(awardBeat("premioInspector", "Premio Inspector: alcanzaste con éxito el día 3."));
  }
  if (game.daysCompleted >= 6) {
    beats.push(awardBeat("premioBurocracia", "Premio Burocracia: alcanzaste con éxito el día 6."));
  }
  if (game.daysCompleted >= 3 && !game.letThroughKappa) {
    beats.push(awardBeat("premioKappa", "Premio Kappa: no se te pasó ni un solo kappa."));
  }
  if (game.daysCompleted >= 2 && !game.letThroughKitsune) {
    beats.push(awardBeat("premioKitsune", "Premio Kitsune: no se te pasó ni un solo kitsune."));
  }
  if (game.daysCompleted >= 1 && !game.letThroughOni) {
    beats.push(awardBeat("premioOni", "Premio Oni: no se te pasó ningún cuernudo."));
  }
  if (game.bestDayVisitors > 15) {
    beats.push(awardBeat("premioVelocidad", "Premio Velocidad: atendiste a " + game.bestDayVisitors + " personas en un solo día (día " + game.bestDayNumber + ")."));
  }
  return beats;
}

let endingBeats: EndingBeat[] = ENDING_DEFEAT;
let endingBeatIndex = 0;

function renderEndingBeat(): void {
  const beat = endingBeats[endingBeatIndex];
  const backdropEl = document.querySelector("#final-backdrop");
  if (backdropEl !== null) backdropEl.className = beat.backdrop;

  const portraitEl = document.querySelector("#final-portrait");
  if (portraitEl !== null) portraitEl.className = beat.portrait ?? "";

  const awardEl = document.querySelector("#final-award") as HTMLElement | null;
  if (awardEl !== null) {
    awardEl.className = beat.award ?? "";
    // reinicia las animaciones para que el giro coincida con la entrada de ESTE
    // premio en vez de seguir la fase del anterior (el elemento no se recrea,
    // solo le cambia la clase) - mismo truco de reflow que resetElementOffscreen()
    awardEl.style.animation = "none";
    void awardEl.offsetWidth;
    awardEl.style.animation = "";
  }

  typeDialogue(beat.text, "#final-message");

  const hasMoreBeats = endingBeatIndex < endingBeats.length - 1;
  const continueBtn = document.querySelector("#final-continue-btn") as HTMLElement | null;
  const backBtn = document.querySelector("#back-to-menu-btn") as HTMLElement | null;
  if (continueBtn !== null) continueBtn.classList.toggle("hidden", !hasMoreBeats);
  if (backBtn !== null) backBtn.classList.toggle("hidden", hasMoreBeats);
}

function renderFinalScreen(): void {
  if (game === null) {
    return;
  }

  // la racha ya viene actualizada con ESTA partida: Game la registra al guardar
  // el resultado en el historial (ver decide()/endDay()), antes de llegar aca
  const resultStreak = getResultStreak();
  const repeatedResult = resultStreak.count >= CONSECUTIVE_FOR_SPECIAL_ENDING;

  // orden de prioridad, de mas raro a mas comun: 3 seguidas manda sobre todo lo
  // demas, despues el dinero, despues los errores
  if (!game.isWon()) {
    const seConvierteEnYokai = repeatedResult && resultStreak.result === "derrota";
    endingBeats = seConvierteEnYokai ? ENDING_YOKAI : ENDING_DEFEAT;
    soundManager.playLose(); // sonido de derrota
    if (seConvierteEnYokai) {
      // lo que anuncia el segundo cuadro de ENDING_YOKAI: se borra historial,
      // partida en curso y rachas (la de resultados incluida, asi el contador
      // vuelve a cero y el final no se repite en la derrota siguiente)
      clearSavedGames();
    }
  } else if (repeatedResult && resultStreak.result === "victoria") {
    endingBeats = ENDING_BOSS;
    soundManager.playVictory(); // sonido de victoria
  } else if (game.money >= RICH_BOSS_MONEY) {
    endingBeats = ENDING_RICH_BOSS;
    soundManager.playVictory(); // sonido de victoria
  } else if (game.errors <= 1) {
    endingBeats = ENDING_WIN_SPECIAL;
    soundManager.playVictory(); // sonido de victoria
  } else {
    endingBeats = ENDING_WIN_REGULAR;
    soundManager.playVictory(); // sonido de victoria
  }
  // concat, no push: los ENDING_* son constantes compartidas entre partidas
  endingBeats = endingBeats.concat(buildAwardBeats());
  endingBeatIndex = 0;
  renderEndingBeat();
}

document.querySelector("#final-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
  endingBeatIndex += 1;
  renderEndingBeat();
});

document.querySelector("#back-to-menu-btn")?.addEventListener("click", () => {
  soundManager.playNextButton(); // sonido de click del boton
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
    .then(parts => {
      const faceUrls = parts.rostro.concat(parts.alienes).map((name: string) => "img/baseCharacters/" + name + ".png");
      const eyesUrls = parts.ojos.map((name: string) => "img/eyes/" + name + ".png");
      const mouthUrls = parts.boca.map((name: string) => "img/mouth/" + name + ".png");
      preloadImages(faceUrls);
      preloadImages(eyesUrls);
      preloadImages(mouthUrls);
      preloadImages(["img/eyes/" + parts.ojosAmarillos + ".png"]);
    })
    .catch(error => console.log("no se pudieron precargar las imagenes", error));
}

// --- Moneda girando junto al dinero (solo se ve mientras #game-screen esta visible,
// pero el intervalo arranca una sola vez y queda corriendo, mas simple que prenderlo
// y apagarlo en cada cambio de pantalla) ---

function startCoinSpin(): void {
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

// --- Estado inicial al cargar la página ---

updateContinueButton();
updateTimerToggleButton();
renderHistoryTable();
preloadCharacterImages();
startCoinSpin();
