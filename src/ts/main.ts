import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory, savePlayerName, loadPlayerName, getAllCredits } from "./Storage.js";

let game: Game | null = null;
let currentState: string = "menu";

// la duracion tiene que coincidir con la transicion de "left" de #character-portrait en style.css
const PORTRAIT_ANIM_MS = 450;
const PORTRAIT_REST_LEFT = "34.8%";

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
const PASSPORT_ARC_BASE = { left: 50, top: 88, height: 3 };
const PASSPORT_ARC_CONTROL = { left: 55, top: -35 };
const PASSPORT_ARC_DESK = { left: 60, top: 83, height: 16 };

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

// al confirmar el nombre arranca la partida nueva (esto reemplaza lo que antes
// hacia el click de "Nueva partida" directamente)
document.querySelector("#player-name-form")?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const input = document.querySelector("#player-name-input") as HTMLInputElement | null;
  const nombre = input?.value.trim() ?? "";
  savePlayerName(nombre);

  game = new Game(nombre);
  racha = 0;
  erroresSeguidos = 0;
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

function slideOutSlidingElements(direccion: "izquierda" | "derecha", alTerminar: () => void): void {
  const acceptBtn = document.querySelector("#accept-btn") as HTMLButtonElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLButtonElement | null;

  if (acceptBtn !== null) acceptBtn.disabled = true;
  if (rejectBtn !== null) rejectBtn.disabled = true;

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

  resetElementOffscreen(CHARACTER_ELEMENT);

  // se mantienen deshabilitados hasta que el jugador abra el pasaporte (ver el
  // listener de click de #passport-object) - no se puede decidir a ciegas
  const acceptBtn = document.querySelector("#accept-btn") as HTMLButtonElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLButtonElement | null;
  if (acceptBtn !== null) acceptBtn.disabled = true;
  if (rejectBtn !== null) rejectBtn.disabled = true;

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

  const acceptBtn = document.querySelector("#accept-btn") as HTMLButtonElement | null;
  const rejectBtn = document.querySelector("#reject-btn") as HTMLButtonElement | null;
  if (acceptBtn !== null) acceptBtn.disabled = true;
  if (rejectBtn !== null) rejectBtn.disabled = true;

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
      });
    }, PASSPORT_ANIM_MS);
  }, DECISION_STAMP_FLASH_MS);
}

document.querySelector("#accept-btn")?.addEventListener("click", () => {
  resolveDecision(true);
});

document.querySelector("#reject-btn")?.addEventListener("click", () => {
  resolveDecision(false);
});

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

    const acceptBtn = document.querySelector("#accept-btn") as HTMLButtonElement | null;
    const rejectBtn = document.querySelector("#reject-btn") as HTMLButtonElement | null;
    if (acceptBtn !== null) acceptBtn.disabled = false;
    if (rejectBtn !== null) rejectBtn.disabled = false;
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
