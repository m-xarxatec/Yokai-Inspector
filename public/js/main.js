import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory, savePlayerName, loadPlayerName, getAllCredits, saveDayStreaks, loadDayStreaks } from "./Storage.js";
import { SoundManager } from "./classes/SoundManager.js";
import { MusicManager } from "./classes/MusicManager.js";
let game = null;
let currentState = "menu";
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
let dayStreaks = [];
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
// tiempo del dia completo (ya no es por visitante) - fijo: la dificultad ya sube
// sola por la proporcion de problematicos y la cantidad de reglas activas por dia
const DAY_DURATION_MS = 90000;
let streak = 0;
let timerEnabled = true;
// variantes del retrato de la Jefa cuando explica las reglas entre dias; se elige
// una al azar cada vez, para que no sea siempre la misma pose
const JEFA_EXPLICA_VARIANTS = ["jefaExplica-1", "jefaExplica-2", "jefaExplica-3", "jefaExplica-4", "jefaExplica-5"];
// cuadros de la moneda que gira junto al dinero, en orden de ida y vuelta para
// que el giro se vea continuo (sin salto entre el ultimo cuadro y el primero)
const COIN_SPIN_FRAMES = ["moneda-1", "moneda-2", "moneda-3", "moneda-4", "moneda-3", "moneda-2"];
function changeState(newState) {
    currentState = newState;
    document.querySelectorAll("section").forEach(section => {
        section.classList.add("hidden");
    });
    document.querySelector(`#${newState}-screen`)?.classList.remove("hidden");
    // la musica del menu sigue sonando sin cortes desde que arranca el juego
    // (menu) hasta que la jefa termina de explicar las reglas: pasa por
    // name-entry (nombre del jugador), story (bienvenida) y day-result mientras
    // todavia se estan mostrando los cuadros de la intro del dia 1
    // (introBeatIndex !== null). Cuando la intro termina, introBeatIndex vuelve
    // a null ANTES de cambiar a "game", asi que ahi ya no entra en esta lista.
    const sigueLaMusicaDelMenu = newState === "menu" ||
        newState === "name-entry" ||
        newState === "story" ||
        (newState === "day-result" && introBeatIndex !== null);
    if (sigueLaMusicaDelMenu) {
        musicManager.playMenu();
    }
    else {
        musicManager.stop();
    }
}
// --- Menu screen ---
function updateContinueButton() {
    const button = document.querySelector("#continue-btn");
    const savedGame = loadCurrentGame();
    if (button !== null) {
        button.disabled = savedGame === null;
    }
    const statusEl = document.querySelector("#paused-status");
    if (statusEl === null) {
        return;
    }
    const statusHtmlEl = statusEl;
    if (savedGame === null) {
        statusHtmlEl.classList.add("hidden");
        return;
    }
    statusHtmlEl.classList.remove("hidden");
    statusEl.textContent = "⏸ Partida pausada — Día " + savedGame.dayNumber + " / 7";
}
function updateTimerToggleButton() {
    const button = document.querySelector("#timer-toggle-btn");
    if (button === null) {
        return;
    }
    if (timerEnabled) {
        button.textContent = "Desactivar temporizador";
    }
    else {
        button.textContent = "Activar temporizador";
    }
}
document.querySelector("#timer-toggle-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    timerEnabled = !timerEnabled;
    updateTimerToggleButton();
});
// al confirmar el nombre arranca la partida nueva (esto reemplaza lo que antes
// hacia el click de "Nueva partida" directamente)
document.querySelector("#player-name-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    soundManager.playNextButton(); // sonido de click del boton
    const input = document.querySelector("#player-name-input");
    const name = input?.value.trim() ?? "";
    savePlayerName(name);
    game = new Game(name);
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
document.querySelectorAll(".back-link").forEach(button => {
    button.addEventListener("click", () => {
        soundManager.playNextButton(); // sonido de click del boton
        changeState("menu");
    });
});
// disponible desde historia/juego/resultado del dia: vuelve al menu sin terminar
// el dia actual, tal como quedaria si se recargara la pagina a mitad de partida
// (la partida guardada solo se actualiza al empezar cada dia, asi que sigue
// disponible para "Continuar partida" desde donde arranco el dia).
document.querySelectorAll(".exit-to-menu-btn").forEach(button => {
    button.addEventListener("click", () => {
        soundManager.playNextButton(); // sonido de click del boton
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
document.querySelector("#options-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    changeState("options");
});
document.querySelector("#exit-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    changeState("exit");
});
document.querySelector("#credits-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    renderCreditsScreen();
    changeState("credits");
});
function renderCreditsScreen() {
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
function renderHistoryTable() {
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
        dayCell.textContent = "Día " + entry.day + " / 7";
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
function renderStoryScreen() {
    if (game === null) {
        return;
    }
    const text = "Bienvenido, detective " + game.playerName + ". Eres un nuevo oficial de la Agencia de Aduana Espiritual, contratado el mismo día en que empieza tu turno (Día 1). Tu trabajo es revisar los pasaportes de quienes cruzan hacia el mundo humano y decidir si los dejas pasar, según las reglas que la agencia va confirmando día a día sobre los Yokai.";
    typeDialogue(text, "#story-text");
}
const DAY_ONE_INTRO_BEATS = [
    { image: "jefaPresentacion", text: "Es tu primer día en la agencia espiritual. Nadie te dio un manual de bienvenida, no lo necesitas porque en tu currículum dice que tienes mucha experiencia." },
    { image: "jefaNeutral", text: "La regla es muy clara: PROHIBIDA LA ENTRADA A QUIEN TENGA CUERNOS. Los oni no pasan." },
    { image: "jefaExplica-1", text: "Cuidado, ellos saben esconderlos bien. ¡Bienvenido a tu nuevo puesto!" },
];
let introBeatIndex = null;
function renderJefaBeat(beat) {
    const jefaEl = document.querySelector("#jefa-portrait");
    if (jefaEl !== null)
        jefaEl.className = beat.image;
    const summaryEl = document.querySelector("#day-result-summary");
    if (summaryEl !== null)
        summaryEl.classList.add("hidden");
    typeDialogue(beat.text, "#next-day-message");
}
// distingue, dentro de #day-result-screen, un cambio de regla (mensajeIntro/
// DAY_ONE_INTRO_BEATS) de una reaccion por error (ERROR_REACTIONS): el color
// del kicker es la unica pista visual, porque el propio parrafo usa siempre
// --font-body en los dos casos
function setNoticeType(type) {
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
        soundManager.playNextPlease(); // llama al primer pasajero de la partida
        renderVisitor();
        startDayTimer();
    });
});
// --- Game screen ---
// --- efecto de dialogo tipo subtitulo (palabra por palabra) ---
let dialogueIntervalId = null;
function typeDialogue(text, targetSelector) {
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
const CHARACTER_ELEMENT = { selector: "#character-portrait", restLeft: PORTRAIT_REST_LEFT };
const SLIDING_ELEMENTS = [CHARACTER_ELEMENT];
function resetElementOffscreen(element) {
    const el = document.querySelector(element.selector);
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
function setDecisionStampsEnabled(enabled) {
    const acceptBtn = document.querySelector("#accept-btn");
    const rejectBtn = document.querySelector("#reject-btn");
    [acceptBtn, rejectBtn].forEach(el => {
        if (el !== null) {
            el.setAttribute("aria-disabled", enabled ? "false" : "true");
        }
    });
}
function slideOutSlidingElements(direction, onFinish) {
    setDecisionStampsEnabled(false);
    SLIDING_ELEMENTS.forEach(({ selector }) => {
        const el = document.querySelector(selector);
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
function createCubicBezierEasing(x1, y1, x2, y2) {
    function onAxis(a1, a2, t) {
        const oneMinusT = 1 - t;
        return 3 * oneMinusT * oneMinusT * t * a1 + 3 * oneMinusT * t * t * a2 + t * t * t;
    }
    function derivativeOnAxis(a1, a2, t) {
        const oneMinusT = 1 - t;
        return 3 * oneMinusT * oneMinusT * a1 + 6 * oneMinusT * t * (a2 - a1) + 3 * t * t * (1 - a2);
    }
    return function easing(x) {
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
// mueve #passport-object en una curva de bezier cuadratica (desde -> control ->
// hasta), con el tamaño interpolado con el mismo facilitador para que el rebote
// tambien se sienta en el "crecimiento" - queda con estilos inline al terminar,
// asi que alTerminar() es responsable de limpiarlos si hace falta.
//
// terminaEnElEscritorio indica la direccion (true = entrega, false = devolucion):
// el pasaporte solo va "al frente" (encima de la ventanilla/el escritorio) en el
// tramo del recorrido mas cercano al escritorio - el resto del arco (saliendo o
// volviendo hacia el personaje, y el pico) queda detras, ver PASSPORT_ARC_FRONT_THRESHOLD
function animatePassportAlongArc(from, control, to, durationMs, easing, endsAtDesk, onFinish) {
    const passportEl = document.querySelector("#passport-object");
    if (passportEl === null) {
        onFinish();
        return;
    }
    const el = passportEl;
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
    function step(now) {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const t = easing(progress);
        const oneMinusT = 1 - t;
        const left = oneMinusT * oneMinusT * from.left + 2 * oneMinusT * t * control.left + t * t * to.left;
        const top = oneMinusT * oneMinusT * from.top + 2 * oneMinusT * t * control.top + t * t * to.top;
        const height = from.height + (to.height - from.height) * t;
        el.style.left = left + "%";
        el.style.top = top + "%";
        el.style.height = height + "%";
        let inFront;
        if (endsAtDesk) {
            if (top > minTopSeen) {
                pastPeak = true;
            }
            else {
                minTopSeen = top;
            }
            inFront = pastPeak;
        }
        else {
            const approachingDesk = 1 - progress;
            inFront = approachingDesk >= PASSPORT_ARC_FRONT_THRESHOLD;
        }
        if (inFront) {
            el.style.zIndex = "";
        }
        else {
            el.style.zIndex = PASSPORT_BEHIND_Z_INDEX;
        }
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
        else {
            onFinish();
        }
    }
    window.requestAnimationFrame(step);
}
// --- tiempo limite del dia ---
let dayTimeoutId = null;
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
let dayResumedAt = null;
function currentDayElapsedMs() {
    if (dayResumedAt === null) {
        return dayElapsedMs;
    }
    return dayElapsedMs + (performance.now() - dayResumedAt);
}
function clearDayTimer() {
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
let clockIntervalId = null;
// solo detiene el intervalo visual (deja el reloj congelado en su ultimo
// cuadro) - no toca dayElapsedMs/dayResumedAt, eso lo maneja quien pause/pare
// el dia de verdad (pauseDayTimer()/clearDayTimer())
function stopDayClock() {
    if (clockIntervalId !== null) {
        window.clearInterval(clockIntervalId);
        clockIntervalId = null;
    }
}
function startDayClock() {
    stopDayClock();
    updateDayClock();
    clockIntervalId = window.setInterval(updateDayClock, CLOCK_TICK_MS);
}
function updateDayClock() {
    const clockEl = document.querySelector("#day-clock");
    if (clockEl === null) {
        return;
    }
    const elapsed = currentDayElapsedMs();
    const remaining = Math.max(DAY_DURATION_MS - elapsed, 0);
    const dayQuarter = DAY_DURATION_MS / 4;
    const frame = Math.floor(elapsed / CLOCK_FRAME_MS) % 2 === 0 ? "frame-a" : "frame-b";
    let stage;
    if (remaining <= CLOCK_BROKEN_THRESHOLD_MS) {
        stage = "broken";
    }
    else if (remaining <= dayQuarter) {
        stage = "stage-empty";
    }
    else if (remaining <= dayQuarter * 2) {
        stage = "stage-almost";
    }
    else if (remaining <= dayQuarter * 3) {
        stage = "stage-half";
    }
    else {
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
    }
    else if (stage === "stage-empty" || (stage === "stage-almost" && remaining <= dayQuarter * 2.5)) {
        clockEl.classList.add("pulse-light");
    }
}
function onDayTimerExpire() {
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
function startDayTimer() {
    clearDayTimer();
    const clockEl = document.querySelector("#day-clock");
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
function pauseDayTimer() {
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
function resumeDayTimer() {
    if (!timerEnabled || game === null || dayResumedAt !== null) {
        return;
    }
    dayResumedAt = performance.now();
    startDayClock();
    const remainingMs = Math.max(DAY_DURATION_MS - dayElapsedMs, 0);
    dayTimeoutId = window.setTimeout(onDayTimerExpire, remainingMs);
}
function renderVisitor() {
    if (game === null || game.currentVisitor === null) {
        return;
    }
    resetElementOffscreen(CHARACTER_ELEMENT);
    // se mantienen deshabilitados hasta que el jugador abra el pasaporte (ver el
    // listener de click de #passport-object) - no se puede decidir a ciegas
    setDecisionStampsEnabled(false);
    const visitor = game.currentVisitor;
    const passport = visitor.obtainPassport;
    const passportEl = document.querySelector("#passport-object");
    const decisionStampEl = document.querySelector("#decision-stamp");
    if (decisionStampEl !== null) {
        decisionStampEl.classList.remove("show", "approved", "rejected");
    }
    if (passportEl !== null) {
        // se esconde del todo (todavia no lo "lanzo") - nada de dejarlo chiquito
        // pero visible: eso es lo que se quedaba pegado en la ventanilla despues
        // de devolverse
        passportEl.style.display = "none";
        passportEl.classList.remove("open", "delivered", ...PASSPORT_DESK_LOOK_VARIANTS);
        passportEl.classList.add("closed");
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
    if (nameEl !== null)
        nameEl.textContent = passport.obtainName;
    if (regionEl !== null)
        regionEl.textContent = passport.obtainRegion;
    if (passportStampEl !== null)
        passportStampEl.className = passport.obtainStamp;
    // visible desde el dia 1 (antes se ocultaba hasta el dia 4, que es cuando
    // arranca a importar para alguna regla) - se muestra ya de entrada para que
    // el jugador se acostumbre a leer el dato antes de que dependa de el
    if (specieEl !== null) {
        specieEl.style.display = "";
        specieEl.textContent = passport.obtainDeclaredSpecie;
    }
    typeDialogue(visitor.dialogueLine(), "#dialogue-bubble");
    const faceEl = document.querySelector(".part-face");
    const eyesEl = document.querySelector(".part-eyes");
    const mouthEl = document.querySelector(".part-mouth");
    const hairEl = document.querySelector(".part-hair");
    const hornsEl = document.querySelector(".part-horns");
    if (faceEl !== null)
        faceEl.className = "part part-face " + visitor.obtainFace;
    if (eyesEl !== null) {
        const eyesVariant = visitor.obtainYellowEyes ? "yellowEyes" : visitor.obtainEyes;
        eyesEl.className = "part part-eyes " + eyesVariant;
    }
    if (mouthEl !== null)
        mouthEl.className = "part part-mouth " + visitor.obtainMouth;
    if (hairEl !== null)
        hairEl.className = "part part-hair " + visitor.obtainHair;
    if (hornsEl !== null) {
        if (visitor.obtainHaveHorns) {
            hornsEl.className = "part part-horns " + visitor.obtainHorns;
            hornsEl.style.display = "";
        }
        else {
            hornsEl.style.display = "none";
        }
    }
    // "DÍA"/"ERRORES"/"RACHA" ya estan dibujados dentro de fondoPantallaJuegoT.png
    // (ver style.css #hud) - aca solo se ponen los valores, no el texto completo
    const dayEl = document.querySelector("#day-counter");
    const errorsEl = document.querySelector("#error-counter");
    const moneyEl = document.querySelector("#money-counter");
    const streakEl = document.querySelector("#streak-counter");
    const sceneEl = document.querySelector("#character-scene");
    if (dayEl !== null)
        dayEl.textContent = game.dayNumber + " / 7";
    if (errorsEl !== null) {
        errorsEl.textContent = game.errors + " / 4";
        if (game.errors >= 3) {
            errorsEl.classList.add("danger");
        }
        else {
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
        }
        else {
            sceneEl.classList.remove("alert");
        }
    }
    if (moneyEl !== null)
        moneyEl.textContent = "Dinero: " + game.money;
    if (streakEl !== null)
        streakEl.textContent = String(streak);
}
function afterDecision(dayBefore) {
    if (game === null) {
        return;
    }
    if (game.isLost() || game.isWon()) {
        clearDayTimer();
        dayStreaks.push(streak);
        saveDayStreaks(dayStreaks);
        renderFinalScreen();
        changeState("final");
        return;
    }
    if (game.dayNumber > dayBefore) {
        clearDayTimer();
        dayStreaks.push(streak);
        saveDayStreaks(dayStreaks);
        streak = 0; // la racha arranca de nuevo en cada dia (ver docs/ideas.md)
        changeState("day-result"); // primero cambia de pantalla para que no corte el audio de abajo
        renderDayResultScreen();
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
const ERROR_REACTIONS = {
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
function showErrorReaction(accept, errorNumber) {
    const reactions = ERROR_REACTIONS[errorNumber];
    if (reactions === undefined) {
        return;
    }
    setNoticeType("error");
    renderJefaBeat(accept ? reactions.throughReaction : reactions.rejectedReaction);
    errorReactionPending = true;
    pauseDayTimer();
    changeState("day-result");
}
function resolveDecision(accept) {
    if (game === null) {
        return;
    }
    // ojo: NO se toca el temporizador aca - es por dia, no por visitante, tiene
    // que seguir corriendo mientras se decide (ver startDayTimer()). Se marca
    // que hay una decision en curso para que, si el dia vence en el medio, no
    // se corte a la mitad (ver diaTerminaAlSoltar mas abajo y en startDayTimer()).
    resolvingDecision = true;
    const dayBefore = game.dayNumber;
    const errorsBefore = game.errors;
    const direction = accept ? "left" : "right";
    setDecisionStampsEnabled(false);
    const decisionStampEl = document.querySelector("#decision-stamp");
    if (decisionStampEl !== null) {
        decisionStampEl.className = "show " + (accept ? "approved" : "rejected");
    }
    const passportEl = document.querySelector("#passport-object");
    // se ve el sello un instante sobre el pasaporte todavia abierto; despues se
    // cierra en el sitio (el sello placeholder desaparece con el), y recien
    // ahi se devuelve - mismo arco de la entrega pero al reves, terminando
    // escondido del todo (no se queda pegado, chico, en la ventanilla). El
    // personaje sale por separado, con el mecanismo de siempre.
    window.setTimeout(() => {
        if (decisionStampEl !== null) {
            decisionStampEl.classList.remove("show", "approved", "rejected");
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
                    game.decide(accept);
                    const justErred = game.errors > errorsBefore;
                    if (justErred) {
                        streak = 0;
                        // si este error hace perder la partida, NO suena el error: solo
                        // el sonido de derrota (ver playLose() en renderFinalScreen())
                        if (!game.isLost()) {
                            soundManager.playWrong();
                        }
                    }
                    else {
                        streak += 1;
                        soundManager.playNextPlease(); // cuño correcto: llama al proximo pasajero
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
const STAMP_REST_POSITION = {
    "reject-btn": { left: 80, top: 78 },
    "accept-btn": { left: 91, top: 78 },
};
// que tan cerca del pasaporte (en px de pantalla, expandiendo su propio
// rectangulo) cuenta como "acercandolo" - bastante generoso a proposito, el
// pasaporte es chico y no hace falta puntería quirúrgica
const STAMP_DROP_MARGIN_PX = 60;
function isNearPassport(clientX, clientY) {
    const passportEl = document.querySelector("#passport-object");
    if (passportEl === null || !passportEl.classList.contains("open")) {
        return false;
    }
    const rect = passportEl.getBoundingClientRect();
    return (clientX >= rect.left - STAMP_DROP_MARGIN_PX &&
        clientX <= rect.right + STAMP_DROP_MARGIN_PX &&
        clientY >= rect.top - STAMP_DROP_MARGIN_PX &&
        clientY <= rect.bottom + STAMP_DROP_MARGIN_PX);
}
function setupStampDrag(id, accept) {
    const stampEl = document.querySelector("#" + id);
    const sceneEl = document.querySelector("#character-scene");
    const rest = STAMP_REST_POSITION[id];
    if (stampEl === null || sceneEl === null || rest === undefined) {
        return;
    }
    function returnToRest() {
        if (stampEl === null)
            return;
        stampEl.classList.remove("dragging", "pos2", "pos3");
        stampEl.classList.add("pos1");
        stampEl.style.left = rest.left + "%";
        stampEl.style.top = rest.top + "%";
        stampEl.style.height = "";
    }
    function move(clientX, clientY) {
        if (stampEl === null || sceneEl === null)
            return;
        const sceneRect = sceneEl.getBoundingClientRect();
        const left = ((clientX - sceneRect.left) / sceneRect.width) * 100;
        const top = ((clientY - sceneRect.top) / sceneRect.height) * 100;
        stampEl.style.left = Math.min(Math.max(left, 2), 98) + "%";
        stampEl.style.top = Math.min(Math.max(top, 2), 98) + "%";
        stampEl.classList.remove("pos2", "pos3");
        stampEl.classList.add(isNearPassport(clientX, clientY) ? "pos3" : "pos2");
    }
    stampEl.addEventListener("pointerdown", (event) => {
        if (stampEl.getAttribute("aria-disabled") === "true") {
            return;
        }
        stampEl.setPointerCapture(event.pointerId);
        stampEl.classList.add("dragging");
        move(event.clientX, event.clientY);
    });
    stampEl.addEventListener("pointermove", (event) => {
        if (!stampEl.classList.contains("dragging")) {
            return;
        }
        move(event.clientX, event.clientY);
    });
    stampEl.addEventListener("pointerup", (event) => {
        if (!stampEl.classList.contains("dragging")) {
            return;
        }
        const droppedNearPassport = isNearPassport(event.clientX, event.clientY);
        returnToRest();
        if (droppedNearPassport) {
            // sonido del sello al soltarlo sobre el pasaporte: verde = aceptar, rojo = rechazar
            accept ? soundManager.playAccept() : soundManager.playReject();
            resolveDecision(accept);
        }
    });
    // activar/desactivar aria-disabled ya alcanza para que el mouse no arranque
    // el arrastre (ver el chequeo al principio de pointerdown), pero el teclado
    // (Enter/Espacio) no dispara pointerdown - se agrega un atajo directo, sin
    // arrastre, equivalente al viejo click del <button>
    stampEl.addEventListener("keydown", (event) => {
        if (stampEl.getAttribute("aria-disabled") === "true") {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            resolveDecision(accept);
        }
    });
}
setupStampDrag("reject-btn", false);
setupStampDrag("accept-btn", true);
// el pasaporte no se abre solo: el jugador tiene que clickearlo una vez que el
// personaje ya se lo entrego (clase "delivered", ver renderVisitor()); recien
// ahi se habilitan aceptar/rechazar - no se puede decidir sin haberlo abierto
document.querySelector("#passport-object")?.addEventListener("click", () => {
    const passportEl = document.querySelector("#passport-object");
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
    }, PASSPORT_OPEN_DELAY_MS);
});
// --- Day result screen ---
function renderDayResultScreen(showSummary = true) {
    if (game === null) {
        return;
    }
    const summaryEl = document.querySelector("#day-result-summary");
    const messageEl = document.querySelector("#next-day-message");
    if (summaryEl !== null) {
        const summaryHtmlEl = summaryEl;
        if (showSummary) {
            summaryHtmlEl.classList.remove("hidden");
            summaryEl.textContent = "Errores acumulados: " + game.errors + " / 4 — Dinero: " + game.money;
        }
        else {
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
// el cuadro, o arranca el juego si ya era el ultimo), reaccion de la Jefa por
// un error (vuelve al visitante siguiente, SIN reiniciar el temporizador del
// dia - sigue corriendo igual que durante resolveDecision()), o el paso
// normal entre dias (arranca el dia nuevo con su propio temporizador).
document.querySelector("#continue-day-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    if (introBeatIndex !== null) {
        introBeatIndex += 1;
        if (introBeatIndex < DAY_ONE_INTRO_BEATS.length) {
            setNoticeType("rule");
            renderJefaBeat(DAY_ONE_INTRO_BEATS[introBeatIndex]);
            return;
        }
        introBeatIndex = null;
        changeState("game");
        soundManager.playNextPlease(); // llama al primer pasajero del dia 1
        renderVisitor();
        startDayTimer();
        return;
    }
    if (errorReactionPending) {
        errorReactionPending = false;
        changeState("game");
        renderVisitor();
        resumeDayTimer();
        return;
    }
    changeState("game");
    soundManager.playNextPlease(); // llama al primer pasajero del nuevo dia
    renderVisitor();
    startDayTimer();
});
const ENDING_DEFEAT = [
    { backdrop: "defeat", portrait: null, text: "Te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo." },
];
const ENDING_WIN_REGULAR = [
    { backdrop: "win-regular", portrait: null, text: "Tu desempeño ha sido regular en la agencia, pero lo suficientemente bueno para ser ascendido y obtener una oficina nueva sin ventanas, aunque crees que te pagarán más, solo es mucho papeleo por la misma paga." },
    { backdrop: "blurred-office", portrait: "protaDepre", text: "Aunque lograste salvar al mundo y eso debería ser suficiente... felicitaciones, supongo..." },
];
const ENDING_WIN_SPECIAL = [
    { backdrop: "blurred-office", portrait: "jefaTeAma", text: "Has hecho un trabajo tan eficiente que la jefa se ha enamorado de ti... ella y la agencia han ganado mucho dinero por tu desempeño, eres tan bueno que no puedes ser ascendido y deciden quedarse solo contigo y despedir a los otros trabajadores... recibes un aumento de 2 monedas más al mes... felicidades...." },
];
let endingBeats = ENDING_DEFEAT;
let endingBeatIndex = 0;
function renderEndingBeat() {
    const beat = endingBeats[endingBeatIndex];
    const backdropEl = document.querySelector("#final-backdrop");
    if (backdropEl !== null)
        backdropEl.className = beat.backdrop;
    const portraitEl = document.querySelector("#final-portrait");
    if (portraitEl !== null)
        portraitEl.className = beat.portrait ?? "";
    typeDialogue(beat.text, "#final-message");
    const hasMoreBeats = endingBeatIndex < endingBeats.length - 1;
    const continueBtn = document.querySelector("#final-continue-btn");
    const backBtn = document.querySelector("#back-to-menu-btn");
    if (continueBtn !== null)
        continueBtn.classList.toggle("hidden", !hasMoreBeats);
    if (backBtn !== null)
        backBtn.classList.toggle("hidden", hasMoreBeats);
}
function renderFinalScreen() {
    if (game === null) {
        return;
    }
    if (!game.isWon()) {
        endingBeats = ENDING_DEFEAT;
        soundManager.playLose(); // sonido de derrota
    }
    else if (game.errors <= 1) {
        endingBeats = ENDING_WIN_SPECIAL;
        soundManager.playVictory(); // sonido de victoria
    }
    else {
        endingBeats = ENDING_WIN_REGULAR;
        soundManager.playVictory(); // sonido de victoria
    }
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
function preloadImages(urls) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}
function preloadCharacterImages() {
    fetch("data/partes.json")
        .then(r => r.json())
        .then(parts => {
        const faceUrls = parts.rostro.map((name) => "img/baseCharacters/" + name + ".png");
        const eyesUrls = parts.ojos.map((name) => "img/eyes/" + name + ".png");
        const mouthUrls = parts.boca.map((name) => "img/mouth/" + name + ".png");
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
function startCoinSpin() {
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
//# sourceMappingURL=main.js.map