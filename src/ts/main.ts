import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory, savePlayerName, loadPlayerName, getAllCredits, saveDayStreaks, loadDayStreaks } from "./Storage.js";

let game: Game | null = null;
let currentState: string = "menu";

// racha con la que termino cada dia de la partida en curso - se guarda en
// localStorage al cerrar cada dia (ver afterDecision()), todavia sin usarse
// para nada mas (queda preparada para una idea a futuro, ver docs/ideas.md)
let rachasPorDia: number[] = [];

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
const PASSPORT_DESK_LOOK_VARIANTS = ["mesa1", "mesa2", "mesa3"];

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

// tiempo del dia completo (ya no es por visitante) - fijo: la dificultad ya sube
// sola por la proporcion de problematicos y la cantidad de reglas activas por dia
const DAY_DURATION_MS = 90000;

let racha: number = 0;
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

// al confirmar el nombre arranca la partida nueva (esto reemplaza lo que antes
// hacia el click de "Nueva partida" directamente)
document.querySelector("#player-name-form")?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const input = document.querySelector("#player-name-input") as HTMLInputElement | null;
  const nombre = input?.value.trim() ?? "";
  savePlayerName(nombre);

  game = new Game(nombre);
  racha = 0;
  rachasPorDia = [];
  saveDayStreaks(rachasPorDia);
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.startNewGame();
    renderStoryScreen();
    changeState("story");
  });
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
    clearDayTimer();
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
  changeState("name-entry");
});

function renderStoryScreen(): void {
  if (game === null) {
    return;
  }
  const texto = "Bienvenido, detective " + game.playerName + ". Eres un nuevo oficial de la Agencia de Aduana Espiritual, contratado el mismo día en que empieza tu turno (Día 1), sin inducción ni manual de bienvenida. Tu trabajo es revisar los pasaportes de quienes cruzan hacia el mundo humano y decidir si los dejas pasar, según las reglas que la agencia va confirmando día a día sobre los Yokai.";
  typeDialogue(texto, "#story-text");
}

document.querySelector("#story-next-btn")?.addEventListener("click", () => {
  renderDayResultScreen(false);
  changeState("day-result");
});

document.querySelector("#continue-btn")?.addEventListener("click", () => {
  game = new Game(loadPlayerName());
  racha = 0;
  rachasPorDia = loadDayStreaks();
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

// --- entrada/salida del personaje ---
//
// El pasaporte NO usa este mecanismo: viaja en un arco parabolico propio, ver
// animatePassportAlongArc() mas abajo y su uso en renderVisitor()/resolveDecision().

type ElementoDeslizable = { selector: string; restLeft: string };

const CHARACTER_ELEMENT: ElementoDeslizable = { selector: "#character-portrait", restLeft: PORTRAIT_REST_LEFT };
const SLIDING_ELEMENTS: ElementoDeslizable[] = [CHARACTER_ELEMENT];

function resetElementOffscreen(elemento: ElementoDeslizable): void {
  const el = document.querySelector(elemento.selector) as HTMLElement | null;
  if (el === null) {
    return;
  }
  el.style.transition = "none";
  el.style.left = "130%";
  void el.offsetWidth; // fuerza el reflow para que el salto instantaneo se registre antes de reactivar la transicion
  el.style.transition = "";
  el.style.left = elemento.restLeft;
}

// los sellos ya no son <button>: son <div role="button"> arrastrables (ver
// setupStampDrag() mas abajo), asi que "disabled" no existe como propiedad -
// se simula con aria-disabled + pointer-events:none (ver .stamp-drag[aria-disabled]
// en style.css), un solo lugar para los 4 puntos del codigo que antes tocaban
// acceptBtn.disabled/rejectBtn.disabled directo.
function setDecisionStampsEnabled(enabled: boolean): void {
  const acceptBtn = document.querySelector("#accept-btn") as HTMLElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLElement | null;
  [acceptBtn, rejectBtn].forEach(el => {
    if (el !== null) {
      el.setAttribute("aria-disabled", enabled ? "false" : "true");
    }
  });
}

function slideOutSlidingElements(direccion: "izquierda" | "derecha", alTerminar: () => void): void {
  setDecisionStampsEnabled(false);

  SLIDING_ELEMENTS.forEach(({ selector }) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el === null) {
      return;
    }
    if (direccion === "izquierda") {
      el.style.left = "-70%";
    }
    if (direccion === "derecha") {
      el.style.left = "130%";
    }
  });

  window.setTimeout(alTerminar, PORTRAIT_ANIM_MS);
}

// --- arco parabolico del pasaporte (lanzado/devuelto a traves de la ventanilla) ---

// evaluador de una curva cubic-bezier(x1,y1,x2,y2), igual a la que usa CSS en
// animation-timing-function - si y2 > 1 el resultado pasa de 1 antes de
// asentarse (efecto de rebote/overshoot); PASSPORT_ARC_EASING no lo usa (y2
// no pasa de 1), es solo una desaceleracion suave, sin rebote
function createCubicBezierEasing(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  function enEje(a1: number, a2: number, t: number): number {
    const unMenosT = 1 - t;
    return 3 * unMenosT * unMenosT * t * a1 + 3 * unMenosT * t * t * a2 + t * t * t;
  }

  function derivadaEnEje(a1: number, a2: number, t: number): number {
    const unMenosT = 1 - t;
    return 3 * unMenosT * unMenosT * a1 + 6 * unMenosT * t * (a2 - a1) + 3 * t * t * (1 - a2);
  }

  return function facilitador(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const pendiente = derivadaEnEje(x1, x2, t);
      if (Math.abs(pendiente) > 0.000001) {
        t = t - (enEje(x1, x2, t) - x) / pendiente;
      }
    }
    return enEje(y1, y2, t);
  };
}

type PuntoPasaporte = { left: number; top: number; height: number };
type PuntoControl = { left: number; top: number };

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
  desde: PuntoPasaporte,
  control: PuntoControl,
  hasta: PuntoPasaporte,
  duracionMs: number,
  facilitador: (t: number) => number,
  terminaEnElEscritorio: boolean,
  alTerminar: () => void
): void {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null) {
    alTerminar();
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
  el.style.zIndex = terminaEnElEscritorio ? PASSPORT_BEHIND_Z_INDEX : "";
  const inicio = performance.now();

  // para la entrega: en cuanto el "top" deja de subir (deja de acercarse a 0,
  // es decir ya curso el punto mas alto del arco) el pasaporte esta cayendo -
  // de ahi en mas siempre al frente, sin importar que tan alto este todavia
  // (ver comentario junto a PASSPORT_ARC_FRONT_THRESHOLD mas arriba)
  let topMinimoVisto = desde.top;
  let yaPasoElPico = false;

  function paso(ahora: number): void {
    const progreso = Math.min((ahora - inicio) / duracionMs, 1);
    const t = facilitador(progreso);
    const unMenosT = 1 - t;

    const left = unMenosT * unMenosT * desde.left + 2 * unMenosT * t * control.left + t * t * hasta.left;
    const top = unMenosT * unMenosT * desde.top + 2 * unMenosT * t * control.top + t * t * hasta.top;
    const height = desde.height + (hasta.height - desde.height) * t;

    el.style.left = left + "%";
    el.style.top = top + "%";
    el.style.height = height + "%";

    let enFrente: boolean;
    if (terminaEnElEscritorio) {
      if (top > topMinimoVisto) {
        yaPasoElPico = true;
      } else {
        topMinimoVisto = top;
      }
      enFrente = yaPasoElPico;
    } else {
      const acercandoseAlEscritorio = 1 - progreso;
      enFrente = acercandoseAlEscritorio >= PASSPORT_ARC_FRONT_THRESHOLD;
    }

    if (enFrente) {
      el.style.zIndex = "";
    } else {
      el.style.zIndex = PASSPORT_BEHIND_Z_INDEX;
    }

    if (progreso < 1) {
      window.requestAnimationFrame(paso);
    } else {
      alTerminar();
    }
  }

  window.requestAnimationFrame(paso);
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
let resolviendoDecision = false;
let diaTerminaAlSoltar = false;

function clearDayTimer(): void {
  if (dayTimeoutId !== null) {
    clearTimeout(dayTimeoutId);
    dayTimeoutId = null;
  }
  stopDayClock();
}

// --- reloj de arena del dia (reemplaza la barra de tiempo por visitante de antes) ---
//
// 4 etapas (full/medio/casi/vacio) repartidas en partes iguales del tiempo del
// dia, cada una alternando entre sus 2 cuadros (mismo criterio que
// COIN_SPIN_FRAMES) para dar sensacion de movimiento; al quedar <=3s (o
// vencer) pasa a "roto". Corre en un intervalo aparte (no un solo setTimeout
// como el dia): a diferencia de la barra vieja (CSS puro, animationDuration)
// esto necesita re-evaluar la etapa/cuadro/parpadeo a cada rato.
const CLOCK_FRAME_MS = 450;
const CLOCK_TICK_MS = 200;
const CLOCK_BROKEN_THRESHOLD_MS = 3000;

let dayStartedAt: number | null = null;
let clockIntervalId: number | null = null;

function stopDayClock(): void {
  if (clockIntervalId !== null) {
    window.clearInterval(clockIntervalId);
    clockIntervalId = null;
  }
  dayStartedAt = null;
}

function startDayClock(): void {
  stopDayClock();
  dayStartedAt = performance.now();
  updateDayClock();
  clockIntervalId = window.setInterval(updateDayClock, CLOCK_TICK_MS);
}

function updateDayClock(): void {
  const clockEl = document.querySelector("#day-clock") as HTMLElement | null;
  if (clockEl === null || dayStartedAt === null) {
    return;
  }

  const transcurrido = performance.now() - dayStartedAt;
  const restante = Math.max(DAY_DURATION_MS - transcurrido, 0);
  const cuartoDelDia = DAY_DURATION_MS / 4;

  const cuadro = Math.floor(transcurrido / CLOCK_FRAME_MS) % 2 === 0 ? "frame-a" : "frame-b";

  let etapa: string;
  if (restante <= CLOCK_BROKEN_THRESHOLD_MS) {
    etapa = "roto";
  } else if (restante <= cuartoDelDia) {
    etapa = "stage-vacio";
  } else if (restante <= cuartoDelDia * 2) {
    etapa = "stage-casi";
  } else if (restante <= cuartoDelDia * 3) {
    etapa = "stage-medio";
  } else {
    etapa = "stage-full";
  }

  clockEl.classList.remove("stage-full", "stage-medio", "stage-casi", "stage-vacio", "roto", "frame-a", "frame-b", "pulso-leve", "pulso-fuerte");
  clockEl.classList.add(etapa);
  if (etapa !== "roto") {
    clockEl.classList.add(cuadro);
  }

  // parpadeo leve desde la segunda mitad de "casi" en adelante, fuerte recien
  // con el reloj roto y una decision todavia en curso (ver resolviendoDecision) -
  // efecto chico a proposito, no debe interrumpir la pantalla
  if (etapa === "roto") {
    if (resolviendoDecision) {
      clockEl.classList.add("pulso-fuerte");
    }
  } else if (etapa === "stage-vacio" || (etapa === "stage-casi" && restante <= cuartoDelDia * 2.5)) {
    clockEl.classList.add("pulso-leve");
  }
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

  startDayClock();

  dayTimeoutId = window.setTimeout(() => {
    if (game === null) {
      return;
    }
    if (resolviendoDecision) {
      diaTerminaAlSoltar = true;
      return;
    }
    const diaAntes = game.dayNumber;
    game.endDay();
    afterDecision(diaAntes);
  }, DAY_DURATION_MS);
}

function renderVisitor(): void {
  if (game === null || game.currentVisitor === null) {
    return;
  }

  resetElementOffscreen(CHARACTER_ELEMENT);

  // se mantienen deshabilitados hasta que el jugador abra el pasaporte (ver el
  // listener de click de #passport-object) - no se puede decidir a ciegas
  setDecisionStampsEnabled(false);

  const visitante = game.currentVisitor;
  const pasaporte = visitante.obtainPassport;

  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  const decisionStampEl = document.querySelector("#decision-stamp") as HTMLElement | null;
  if (decisionStampEl !== null) {
    decisionStampEl.classList.remove("mostrar", "aprobado", "rechazado");
  }
  if (passportEl !== null) {
    // se esconde del todo (todavia no lo "lanzo") - nada de dejarlo chiquito
    // pero visible: eso es lo que se quedaba pegado en la ventanilla despues
    // de devolverse
    passportEl.style.display = "none";
    passportEl.classList.remove("abierto", "entregado", ...PASSPORT_DESK_LOOK_VARIANTS);
    passportEl.classList.add("cerrado");
  }

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
        const variante = PASSPORT_DESK_LOOK_VARIANTS[Math.floor(Math.random() * PASSPORT_DESK_LOOK_VARIANTS.length)];
        passportEl.classList.add(variante);
        passportEl.classList.add("entregado");
        passportEl.style.transition = "";
      });
    }
  }, PORTRAIT_ANIM_MS + PASSPORT_DELIVERY_DELAY_MS);

  const nombreEl = document.querySelector("#passport-name");
  const regionEl = document.querySelector("#passport-region");
  const especieEl = document.querySelector("#passport-species");
  const selloEl = document.querySelector("#passport-stamp");

  if (nombreEl !== null) nombreEl.textContent = pasaporte.obtainName;
  if (regionEl !== null) regionEl.textContent = pasaporte.obtainRegion;
  if (selloEl !== null) selloEl.className = pasaporte.obtainStamp;

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

  // "DÍA"/"ERRORES"/"RACHA" ya estan dibujados dentro de fondoPantallaJuegoT.png
  // (ver style.css #hud) - aca solo se ponen los valores, no el texto completo
  const diaEl = document.querySelector("#day-counter");
  const erroresEl = document.querySelector("#error-counter") as HTMLElement | null;
  const dineroEl = document.querySelector("#money-counter");
  const rachaEl = document.querySelector("#streak-counter");
  const sceneEl = document.querySelector("#character-scene") as HTMLElement | null;

  if (diaEl !== null) diaEl.textContent = game.dayNumber + " / 7";
  if (erroresEl !== null) {
    erroresEl.textContent = game.errors + " / 4";
    if (game.errors >= 3) {
      erroresEl.classList.add("danger");
    } else {
      erroresEl.classList.remove("danger");
    }
  }
  // modo alerta: con 3+ errores, el recuadro solido detras de fondoPantallaJuegoT.png
  // (ver style.css .alerta) empieza a parpadear en rosa, lo que se lee como todo
  // el borde de la pantalla en alerta - de momento solo visual, ver docs/ideas.md
  // para un futuro "modo reducir errores"
  if (sceneEl !== null) {
    if (game.errors >= 3) {
      sceneEl.classList.add("alerta");
    } else {
      sceneEl.classList.remove("alerta");
    }
  }
  if (dineroEl !== null) dineroEl.textContent = "Dinero: " + game.money;
  if (rachaEl !== null) rachaEl.textContent = String(racha);
}

function afterDecision(diaAntes: number): void {
  if (game === null) {
    return;
  }

  if (game.isLost() || game.isWon()) {
    clearDayTimer();
    rachasPorDia.push(racha);
    saveDayStreaks(rachasPorDia);
    renderFinalScreen();
    changeState("final");
    return;
  }

  if (game.dayNumber > diaAntes) {
    clearDayTimer();
    rachasPorDia.push(racha);
    saveDayStreaks(rachasPorDia);
    racha = 0; // la racha arranca de nuevo en cada dia (ver docs/ideas.md)
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
  // ojo: NO se toca el temporizador aca - es por dia, no por visitante, tiene
  // que seguir corriendo mientras se decide (ver startDayTimer()). Se marca
  // que hay una decision en curso para que, si el dia vence en el medio, no
  // se corte a la mitad (ver diaTerminaAlSoltar mas abajo y en startDayTimer()).
  resolviendoDecision = true;

  const diaAntes = game.dayNumber;
  const erroresAntes = game.errors;
  const direccion = accept ? "izquierda" : "derecha";

  setDecisionStampsEnabled(false);

  const decisionStampEl = document.querySelector("#decision-stamp") as HTMLElement | null;
  if (decisionStampEl !== null) {
    decisionStampEl.className = "mostrar " + (accept ? "aprobado" : "rechazado");
  }

  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;

  // se ve el sello un instante sobre el pasaporte todavia abierto; despues se
  // cierra en el sitio (el sello placeholder desaparece con el), y recien
  // ahi se devuelve - mismo arco de la entrega pero al reves, terminando
  // escondido del todo (no se queda pegado, chico, en la ventanilla). El
  // personaje sale por separado, con el mecanismo de siempre.
  window.setTimeout(() => {
    if (decisionStampEl !== null) {
      decisionStampEl.classList.remove("mostrar", "aprobado", "rechazado");
    }
    if (passportEl !== null) {
      // vuelve a pasaporte.png (saca la variante "en la mesa" si tenia una):
      // se devuelve mostrando el mismo aspecto con el que se entrego
      passportEl.classList.remove("abierto", "entregado", ...PASSPORT_DESK_LOOK_VARIANTS);
      passportEl.classList.add("cerrado");
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

        slideOutSlidingElements(direccion, () => {
          resolviendoDecision = false;
          if (game === null) {
            return;
          }
          game.decide(accept);

          if (game.errors > erroresAntes) {
            racha = 0;
          } else {
            racha += 1;
          }

          // el dia vencio mientras se animaba esta decision (ver startDayTimer()):
          // recien ahora, con el visitante que el jugador realmente vio ya
          // procesado, se cierra el dia - salvo que decide() ya haya terminado
          // la partida sola (perdio/gano), en cuyo caso no corresponde avanzar.
          if (diaTerminaAlSoltar) {
            diaTerminaAlSoltar = false;
            if (!game.isLost() && !game.isWon()) {
              game.endDay();
            }
          }

          afterDecision(diaAntes);
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
const STAMP_REST_POSITION: Record<string, { left: number; top: number }> = {
  "reject-btn": { left: 80, top: 78 },
  "accept-btn": { left: 91, top: 78 },
};

// que tan cerca del pasaporte (en px de pantalla, expandiendo su propio
// rectangulo) cuenta como "acercandolo" - bastante generoso a proposito, el
// pasaporte es chico y no hace falta puntería quirúrgica
const STAMP_DROP_MARGIN_PX = 60;

function esCercaDelPasaporte(clientX: number, clientY: number): boolean {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null || !passportEl.classList.contains("abierto")) {
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

function setupStampDrag(id: string, accept: boolean): void {
  const stampEl = document.querySelector("#" + id) as HTMLElement | null;
  const sceneEl = document.querySelector("#character-scene") as HTMLElement | null;
  const rest = STAMP_REST_POSITION[id];
  if (stampEl === null || sceneEl === null || rest === undefined) {
    return;
  }

  function volverAlReposo(): void {
    if (stampEl === null) return;
    stampEl.classList.remove("arrastrando", "pos2", "pos3");
    stampEl.classList.add("pos1");
    stampEl.style.left = rest.left + "%";
    stampEl.style.top = rest.top + "%";
    stampEl.style.height = "";
  }

  function mover(clientX: number, clientY: number): void {
    if (stampEl === null || sceneEl === null) return;
    const sceneRect = sceneEl.getBoundingClientRect();
    const left = ((clientX - sceneRect.left) / sceneRect.width) * 100;
    const top = ((clientY - sceneRect.top) / sceneRect.height) * 100;
    stampEl.style.left = Math.min(Math.max(left, 2), 98) + "%";
    stampEl.style.top = Math.min(Math.max(top, 2), 98) + "%";

    stampEl.classList.remove("pos2", "pos3");
    stampEl.classList.add(esCercaDelPasaporte(clientX, clientY) ? "pos3" : "pos2");
  }

  stampEl.addEventListener("pointerdown", (evento: PointerEvent) => {
    if (stampEl.getAttribute("aria-disabled") === "true") {
      return;
    }
    stampEl.setPointerCapture(evento.pointerId);
    stampEl.classList.add("arrastrando");
    mover(evento.clientX, evento.clientY);
  });

  stampEl.addEventListener("pointermove", (evento: PointerEvent) => {
    if (!stampEl.classList.contains("arrastrando")) {
      return;
    }
    mover(evento.clientX, evento.clientY);
  });

  stampEl.addEventListener("pointerup", (evento: PointerEvent) => {
    if (!stampEl.classList.contains("arrastrando")) {
      return;
    }
    const soltadoCercaDelPasaporte = esCercaDelPasaporte(evento.clientX, evento.clientY);
    volverAlReposo();
    if (soltadoCercaDelPasaporte) {
      resolveDecision(accept);
    }
  });

  // activar/desactivar aria-disabled ya alcanza para que el mouse no arranque
  // el arrastre (ver el chequeo al principio de pointerdown), pero el teclado
  // (Enter/Espacio) no dispara pointerdown - se agrega un atajo directo, sin
  // arrastre, equivalente al viejo click del <button>
  stampEl.addEventListener("keydown", (evento: KeyboardEvent) => {
    if (stampEl.getAttribute("aria-disabled") === "true") {
      return;
    }
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      resolveDecision(accept);
    }
  });
}

setupStampDrag("reject-btn", false);
setupStampDrag("accept-btn", true);

// el pasaporte no se abre solo: el jugador tiene que clickearlo una vez que el
// personaje ya se lo entrego (clase "entregado", ver renderVisitor()); recien
// ahi se habilitan aceptar/rechazar - no se puede decidir sin haberlo abierto
document.querySelector("#passport-object")?.addEventListener("click", () => {
  const passportEl = document.querySelector("#passport-object") as HTMLElement | null;
  if (passportEl === null) {
    return;
  }
  if (!passportEl.classList.contains("cerrado") || !passportEl.classList.contains("entregado")) {
    return;
  }
  passportEl.classList.remove("entregado");
  window.setTimeout(() => {
    passportEl.classList.remove("cerrado");
    passportEl.classList.add("abierto");
    setDecisionStampsEnabled(true);
  }, PASSPORT_OPEN_DELAY_MS);
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
  startDayTimer();
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
renderHistoryTable();
preloadCharacterImages();
startCoinSpin();
