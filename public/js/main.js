import { Game } from "./classes/Game.js";
import { loadCurrentGame, savePlayerName, loadPlayerName, saveDayStreaks, loadDayStreaks, getResultStreak, clearSavedGames } from "./Storage.js";
import { SoundManager } from "./classes/SoundManager.js";
import { MusicManager } from "./classes/MusicManager.js";
import { DayTimer } from "./classes/DayTimer.js";
import { createCubicBezierEasing, animatePassportAlongArc } from "./bezierArc.js";
import { typeDialogue, stopDialogue } from "./dialogue.js";
import { preloadCharacterImages } from "./preload.js";
import { startCoinSpin } from "./coinSpin.js";
import { initShop } from "./shop.js";
import { renderCreditsScreen, renderHistoryTable } from "./records.js";
import { CHARACTER_ELEMENT, resetElementOffscreen, setDecisionStampsEnabled, slideOutSlidingElements } from "./characterSlide.js";
import { initStampDrag } from "./stampDrag.js";
let game = null;
let currentState = "menu";
const soundManager = new SoundManager();
const musicManager = new MusicManager();
// se avisa aca (en vez de que DayTimer conozca a Game) cuando el dia vence
// de verdad - ver DayTimer.ts para el porque puede diferirse este aviso
const dayTimer = new DayTimer(() => {
    if (game === null) {
        return;
    }
    const dayBefore = game.dayNumber;
    game.endDay();
    afterDecision(dayBefore);
});
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
// cubic-bezier de desaceleracion sin overshoot (el 4to valor no pasa de 1): sin
// rebote al llegar, frena suave - se aplica igual en la entrega y la vuelta
const PASSPORT_ARC_EASING = createCubicBezierEasing(0.33, 1, 0.68, 1);
// pausa despues de que el personaje termina de llegar (y ya esta con la animacion
// idle) antes de que aparezca el pasaporte - da la sensacion de que lo entrega al
// llegar, no de que lo trae consigo mientras se desliza
const PASSPORT_DELIVERY_DELAY_MS = 500;
// cuanto se ve el sello de aceptado/rechazado sobre el pasaporte todavia abierto
// antes de que empiece a cerrarse
const DECISION_STAMP_FLASH_MS = 400;
// tiempo del dia completo (ya no es por visitante) - la dificultad ya sube
// sola por la proporcion de problematicos y la cantidad de reglas activas
// por dia. Elegible desde el menu principal (ver #day-duration-slider).
let DAY_DURATION_MS = 90000;
let streak = 0;
// pico de racha alcanzado en el dia en curso (streak solo no alcanza: si hubo
// un error a mitad de dia, streak al final puede ser menor al maximo real) -
// ver pantalla de resumen de fin de dia
let maxStreakToday = 0;
let timerEnabled = true;
// variantes del retrato de la Jefa cuando explica las reglas entre dias; se elige
// una al azar cada vez, para que no sea siempre la misma pose
const JEFA_EXPLICA_VARIANTS = ["jefaExplica-1", "jefaExplica-2", "jefaExplica-3", "jefaExplica-4", "jefaExplica-5"];
function changeState(newState) {
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
    statusEl.textContent = "⏸ Partida pausada — Día " + savedGame.dayNumber + " / " + (savedGame.totalDays ?? 7);
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
// --- volumen: un solo control para la musica y todos los efectos juntos ---
document.querySelector("#volume-slider")?.addEventListener("input", (event) => {
    const raw = Number(event.target.value) / 100;
    // curva cuadratica: el oido percibe el volumen de forma logaritmica, no
    // lineal - sin esto, valores "bajos" del slider seguian sonando fuerte
    const volume = raw * raw;
    soundManager.setVolume(volume);
    musicManager.setVolume(volume);
});
// --- zoom de la pantalla de juego: agranda #character-scene entero (HUD,
// --- personaje, pasaporte, todo junto - ya escala solo, ver --scene-zoom en style.css) ---
document.querySelector("#zoom-slider")?.addEventListener("input", (event) => {
    const zoom = Number(event.target.value) / 100;
    document.documentElement.style.setProperty("--scene-zoom", String(zoom));
});
// --- duracion del dia y cantidad de dias de la partida: solo tienen efecto ---
// --- en la PROXIMA partida/dia que arranque, no a mitad de una en curso ---
const DAY_DURATION_OPTIONS_MS = [30000, 60000, 90000, 120000];
document.querySelector("#day-duration-slider")?.addEventListener("input", (event) => {
    const index = Number(event.target.value);
    DAY_DURATION_MS = DAY_DURATION_OPTIONS_MS[index];
    const valueEl = document.querySelector("#day-duration-value");
    if (valueEl !== null) {
        valueEl.textContent = (DAY_DURATION_MS / 1000) + "s";
    }
});
let selectedTotalDays = 7;
document.querySelector("#total-days-slider")?.addEventListener("input", (event) => {
    selectedTotalDays = Number(event.target.value);
    const valueEl = document.querySelector("#total-days-value");
    if (valueEl !== null) {
        valueEl.textContent = String(selectedTotalDays);
    }
});
// --- pantalla completa: usa la Fullscreen API nativa del navegador sobre ---
// --- document.body (no hay un contenedor #app aparte, todo cuelga de body) ---
function updateFullscreenButton() {
    const button = document.querySelector("#fullscreen-toggle-btn");
    if (button === null) {
        return;
    }
    if (document.fullscreenElement === null) {
        button.textContent = "Pantalla completa";
    }
    else {
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
        document.body.requestFullscreen().catch(() => { }); // activa pantalla completa
    }
    else {
        document.exitFullscreen().catch(() => { }); // sale de pantalla completa
    }
});
// al confirmar el nombre arranca la partida nueva (esto reemplaza lo que antes
// hacia el click de "Nueva partida" directamente)
document.querySelector("#player-name-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    soundManager.playNextButton(); // sonido de click del boton
    const input = document.querySelector("#player-name-input");
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
let backLinkTarget = "menu";
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
// de pausa (#pause-btn) tiene su propio listener mas abajo, no entra aca.
// #shop-btn ya no comparte esta clase (ver style.css), tiene su propio
// aspecto de icono, no hace falta excluirlo aca.
document.querySelectorAll(".exit-to-menu-btn:not(#pause-btn)").forEach(button => {
    button.addEventListener("click", () => {
        soundManager.playNextButton(); // sonido de click del boton
        soundManager.stopWrite(); // corta el sonido de escritura si todavia estaba sonando
        dayTimer.clear();
        stopDialogue();
        // por si se sale a mitad de la intro del dia 1 o de una reaccion de error
        // (ambas viven en #day-result-screen) - sin esto, #continue-day-btn podria
        // arrancar mal la proxima vez que se llegue a esa pantalla en una partida
        // nueva (saltandose dayTimer.start() por un errorReactionPending viejo, por ejemplo)
        introBeatIndex = null;
        errorReactionPending = false;
        changeState("menu");
        renderHistoryTable();
        updateContinueButton();
    });
});
// --- pausa real durante el juego: pausa el temporizador del dia de verdad ---
// --- (mismos dayTimer.pause()/dayTimer.resume() que ya usa la reaccion de la Jefa por error) ---
document.querySelector("#pause-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    dayTimer.pause();
    changeState("pause");
});
document.querySelector("#pause-continue-btn")?.addEventListener("click", () => {
    soundManager.playNextButton(); // sonido de click del boton
    changeState("game");
    dayTimer.resume(timerEnabled);
});
// --- tienda: comprar con el dinero acumulado durante la partida (ver shop.ts) ---
initShop(() => game, () => timerEnabled, soundManager, dayTimer, changeState);
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
        dayTimer.start(DAY_DURATION_MS, timerEnabled);
    });
});
// --- Game screen ---
// --- tiempo limite del dia ---
//
// el temporizador del dia entero y el reloj de arena visual que lo
// representa en pantalla viven en DayTimer (ver src/ts/classes/DayTimer.ts,
// instanciado como `dayTimer` mas arriba) - aca solo queda el estado que le
// es ajeno.
// true mientras se muestra la reaccion de la Jefa por un error (ver
// showErrorReaction() mas abajo) - #continue-day-btn la revisa para saber si
// tiene que volver al visitante siguiente en vez de arrancar un dia nuevo
let errorReactionPending = false;
// instante en que se habilito decidir sobre el pasaporte actual (ver el click
// de #passport-object en stampDrag.ts, que avisa con onPassportOpened) -
// null mientras el pasaporte esta cerrado. Se usa en resolveDecision() para
// detectar si el jugador decidio demasiado rapido como para haberlo revisado
// de verdad (ver RUSH_THRESHOLD_MS y Game.decide(), parametro wasRushed).
let passportOpenedAt = null;
const RUSH_THRESHOLD_MS = 700;
function renderVisitor() {
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
    const alienStampEl = document.querySelector("#alien-btn");
    if (alienStampEl !== null) {
        alienStampEl.classList.toggle("hidden", !game.alienStampRuleActive());
    }
    const visitor = game.currentVisitor;
    const passport = visitor.obtainPassport;
    const passportEl = document.querySelector("#passport-object");
    const decisionStampEl = document.querySelector("#decision-stamp");
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
        dayEl.textContent = game.dayNumber + " / " + game.totalDays;
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
    // una partida cortada por errores no "termina el dia" de verdad - va
    // directo al final, sin pasar por el resumen de dia (ver isWon() mas abajo,
    // que SI pasa por el resumen: el dia 7 completo se resume igual que
    // cualquier otro dia, antes de ir a la pantalla final)
    if (game.isLost()) {
        dayTimer.clear();
        dayStreaks.push(streak);
        saveDayStreaks(dayStreaks);
        renderFinalScreen();
        changeState("final");
        return;
    }
    if (game.dayNumber > dayBefore) {
        dayTimer.clear();
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
    soundManager.playWrite(); // sonido de escritura mientras aparece el texto de la jefa por error
    renderJefaBeat(accept ? reactions.throughReaction : reactions.rejectedReaction);
    errorReactionPending = true;
    dayTimer.pause();
    changeState("day-result");
}
// usedAlienStamp = se aprobo con el sello AZUL (el de los alien, desde el dia 6)
// en vez del verde de siempre - ver Game.decide() y setupStampDrag() en stampDrag.ts
function resolveDecision(accept, usedAlienStamp = false) {
    if (game === null) {
        return;
    }
    // se mide ACA (apenas el jugador suelta el sello), no mas abajo cuando recien
    // se llama a game.decide() - esa llamada esta atras de ~2s de animacion, no
    // del tiempo que el jugador realmente tardo en revisar el pasaporte
    const wasRushed = passportOpenedAt !== null && (performance.now() - passportOpenedAt) < RUSH_THRESHOLD_MS;
    // ojo: NO se toca el temporizador aca - es por dia, no por visitante, tiene
    // que seguir corriendo mientras se decide (ver dayTimer.start()). Se marca
    // que hay una decision en curso para que, si el dia vence en el medio, no
    // se corte a la mitad (ver dayEndedWhileResolving mas abajo y DayTimer.ts).
    dayTimer.markResolving();
    const dayBefore = game.dayNumber;
    const errorsBefore = game.errors;
    const direction = accept ? "left" : "right";
    setDecisionStampsEnabled(false);
    const decisionStampEl = document.querySelector("#decision-stamp");
    if (decisionStampEl !== null) {
        let stampLook = accept ? "approved" : "rejected";
        if (usedAlienStamp) {
            stampLook = "alien";
        }
        decisionStampEl.className = "show " + stampLook;
    }
    const passportEl = document.querySelector("#passport-object");
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
                slideOutSlidingElements(direction, PORTRAIT_ANIM_MS, () => {
                    const dayEndedWhileResolving = dayTimer.releaseResolving();
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
                    }
                    else {
                        streak += 1;
                        if (streak > maxStreakToday) {
                            maxStreakToday = streak;
                        }
                    }
                    // el dia vencio mientras se animaba esta decision (ver DayTimer.ts):
                    // recien ahora, con el visitante que el jugador realmente vio ya
                    // procesado, se cierra el dia - salvo que decide() ya haya terminado
                    // la partida sola (perdio/gano), en cuyo caso no corresponde avanzar.
                    if (dayEndedWhileResolving) {
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
// --- sellos: drag and drop real (reemplazan los botones Aceptar/Rechazar,
// ver stampDrag.ts) - incluye el click sobre el pasaporte cerrado para abrirlo ---
initStampDrag(soundManager, resolveDecision, () => {
    passportOpenedAt = performance.now();
});
// --- Day summary screen (resumen narrativo + estadisticas al terminar cada dia) ---
const DAY_END_MESSAGES = [
    "Ha finalizado el día. Vas camino a casa, feliz con tu nuevo empleo.",
    "Ha finalizado tu jornada. Ahora ves que se te está exigiendo más... te duelen los pies y las manos de tanto sellar.",
    "Final de la jornada. Ahora no puedes esperar para estar en casa, llorar un poco y dormir... mucha suerte.",
    "Final de la jornada. Hoy no estás tan agotado... además, la Jefa te ha hecho un cumplido, te sientes afortunado.",
    "Fin de la jornada... tratas de convencerte de que la paga es buena... aunque realmente no lo es...",
    "Jornada de trabajo terminada... día agotador, pero te tranquiliza la idea de que solo te quedan 45 años para jubilarte... suerte.",
    "Fin del día 7... buen trabajo.",
];
function renderDaySummaryScreen(dayNumber, maxStreak) {
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
        dayTimer.resume(timerEnabled);
        return;
    }
    changeState("day-start");
    renderDayStartScreen();
});
// --- Day start screen (reglas activas del dia, antes de arrancar a jugar) ---
function renderDayStartScreen() {
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
    dayTimer.start(DAY_DURATION_MS, timerEnabled);
});
const ENDING_DEFEAT = [
    { backdrop: "defeat", portrait: null, award: null, text: "Te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo." },
];
const ENDING_WIN_REGULAR = [
    { backdrop: "win-regular", portrait: null, award: null, text: "Tu desempeño ha sido regular en la agencia, pero lo suficientemente bueno para ser ascendido y obtener una oficina nueva sin ventanas, aunque crees que te pagarán más, solo es mucho papeleo por la misma paga." },
    { backdrop: "blurred-office", portrait: "protaDepre", award: null, text: "Aunque lograste salvar al mundo y eso debería ser suficiente... felicitaciones, supongo..." },
];
const ENDING_WIN_SPECIAL = [
    { backdrop: "blurred-office", portrait: "jefaTeAma", award: null, text: "Has hecho un trabajo tan eficiente que la jefa se ha enamorado de ti... ella y la agencia han ganado mucho dinero por tu desempeño, eres tan bueno que no puedes ser ascendido y deciden quedarse solo contigo y despedir a los otros trabajadores... recibes un aumento de 2 monedas más al mes... felicidades...." },
];
// perder 3 partidas SEGUIDAS (ver addResultToStreak en Storage.ts): las dos
// primeras derrotas muestran el final normal, la tercera este
const ENDING_YOKAI = [
    { backdrop: "yokai", portrait: null, award: null, text: "Has perdido demasiadas veces consecutivas, te conviertes en yokai y eres tú quien desata el apocalipsis... la jefa llora porque te amaba en secreto... GAME OVER" },
    { backdrop: "yokai", portrait: null, award: null, text: "Del otro lado del mostrador ya no queda nada tuyo: la agencia borró tu expediente completo. Se eliminaron TODAS las partidas guardadas." },
];
// ganar 3 partidas SEGUIDAS
const ENDING_BOSS = [
    { backdrop: "boss", portrait: null, award: null, text: "Has ascendido a jefe... a la inspectora la han degradado a tu puesto... finalmente la vida te sonríe." },
    { backdrop: "boss-worried", portrait: null, award: null, text: "La antigua jefa no puede mantener su lujoso estilo de vida con su nuevo sueldo.... FIN" },
];
// ganar con mucho dinero acumulado (ver RICH_BOSS_MONEY)
const ENDING_RICH_BOSS = [
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
function awardBeat(award, text) {
    return { backdrop: "blurred-office", portrait: null, award: award, text: text };
}
// los tres premios de "no se te paso ninguno" piden ademas haber llegado al dia
// en que esa criatura empieza a aparecer (Oni dia 1, Kitsune dia 2, Kappa dia
// 3): sin eso los ganaria de arriba cualquiera que pierda el primer dia, porque
// nunca vio uno.
function buildAwardBeats() {
    if (game === null) {
        return [];
    }
    const beats = [];
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
    const awardEl = document.querySelector("#final-award");
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
    }
    else if (repeatedResult && resultStreak.result === "victoria") {
        endingBeats = ENDING_BOSS;
        soundManager.playVictory(); // sonido de victoria
    }
    else if (game.money >= RICH_BOSS_MONEY) {
        endingBeats = ENDING_RICH_BOSS;
        soundManager.playVictory(); // sonido de victoria
    }
    else if (game.errors <= 1) {
        endingBeats = ENDING_WIN_SPECIAL;
        soundManager.playVictory(); // sonido de victoria
    }
    else {
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
// --- Estado inicial al cargar la página ---
updateContinueButton();
updateTimerToggleButton();
renderHistoryTable();
preloadCharacterImages();
startCoinSpin();
//# sourceMappingURL=main.js.map