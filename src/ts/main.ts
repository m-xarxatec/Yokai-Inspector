import { Game } from "./classes/Game.js";
import { loadCurrentGame, savePlayerName, loadPlayerName, saveDayStreaks, loadDayStreaks, getResultStreak, clearSavedGames, clearCredits } from "./Storage.js";
import { mulberry32, todayChallengeSeed } from "./random.js";
import { initKeyboardNav, focusFirstControl } from "./keyboardNav.js";
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
import { initMenuYokai, setMenuYokaiActive } from "./menuYokai.js";

let game: Game | null = null;
let currentState: string = "start-gate";
const soundManager = new SoundManager();
const musicManager = new MusicManager();
const dayTimer = new DayTimer(() => {
  if (game === null) {
    return;
  }
  const dayBefore = game.dayNumber;
  game.endDay();
  afterDecision(dayBefore);
});

document.querySelector("#start-gate-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  musicManager.playMenu();
  changeState("menu");
});

let dayStreaks: number[] = [];

const PORTRAIT_ANIM_MS = 450;

const PASSPORT_ANIM_MS = 400;

const PASSPORT_ARC_MS = 700;

const PASSPORT_ARC_BASE = { left: 58, top: 71, height: 3 };
const PASSPORT_ARC_CONTROL = { left: 55, top: -35 };
const PASSPORT_ARC_DESK = { left: 60, top: 68, height: 16 };

const PASSPORT_DESK_LOOK_VARIANTS = ["desk1", "desk2", "desk3"];

const PASSPORT_ARC_EASING = createCubicBezierEasing(0.33, 1, 0.68, 1);

const PASSPORT_DELIVERY_DELAY_MS = 500;

const DECISION_STAMP_FLASH_MS = 400;

let DAY_DURATION_MS = 60000;
let selectedDayDurationMs = 60000;

let hardModeSelected = false;

let streak: number = 0;
let maxStreakToday: number = 0;
let timerEnabled: boolean = true;

const JEFA_EXPLICA_VARIANTS = ["jefaExplica-1", "jefaExplica-2", "jefaExplica-3", "jefaExplica-4", "jefaExplica-5"];

function changeState(newState: string): void {
  currentState = newState;

  const focusedEl = document.activeElement;
  if (focusedEl instanceof HTMLElement) {
    focusedEl.blur();
  }

  document.querySelectorAll("section").forEach(section => {
    section.classList.add("hidden");
  });
  document.querySelector(`#${newState}-screen`)?.classList.remove("hidden");
  setMenuYokaiActive(newState === "menu");

  if (newState === "name-entry") {
    document.querySelector("#player-name-error")?.classList.add("hidden");
  }

  if (newState === "menu") {
    musicManager.playMenu();
  } else {
    musicManager.stop();
  }

  focusFirstControl(newState);
}

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
  statusEl.textContent = "⏸ Partida pausada — Día " + savedGame.dayNumber + " / " + (savedGame.totalDays ?? 7) + (savedGame.hardMode ? " · Difícil" : "");
}

function updateTimerToggleButton(): void {
  const button = document.querySelector("#timer-toggle-btn");
  if (button === null) {
    return;
  }
  if (timerEnabled) {
    button.textContent = "Temporizador ON";
  } else {
    button.textContent = "Temporizador OFF";
  }
}

document.querySelector("#timer-toggle-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  timerEnabled = !timerEnabled;
  updateTimerToggleButton();
});

function applyVolume(sliderValue: number): void {
  const raw = sliderValue / 100;
  const volume = raw * raw;
  soundManager.setVolume(volume);
  musicManager.setVolume(volume);
}

document.querySelector("#volume-slider")?.addEventListener("input", (event) => {
  applyVolume(Number((event.target as HTMLInputElement).value));
});

const volumeSliderEl = document.querySelector("#volume-slider") as HTMLInputElement | null;
if (volumeSliderEl !== null) {
  applyVolume(Number(volumeSliderEl.value));
}

document.querySelector("#zoom-slider")?.addEventListener("input", (event) => {
  const zoom = Number((event.target as HTMLInputElement).value) / 100;
  document.documentElement.style.setProperty("--scene-zoom", String(zoom));
});

const DAY_DURATION_OPTIONS_MS = [30000, 60000, 90000, 120000];

document.querySelector("#day-duration-slider")?.addEventListener("input", (event) => {
  const index = Number((event.target as HTMLInputElement).value);
  selectedDayDurationMs = DAY_DURATION_OPTIONS_MS[index];
  DAY_DURATION_MS = selectedDayDurationMs;
  const valueEl = document.querySelector("#day-duration-value");
  if (valueEl !== null) {
    valueEl.textContent = (selectedDayDurationMs / 1000) + "s";
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

function updateFullscreenButton(): void {
  const button = document.querySelector("#fullscreen-toggle-btn");
  if (button === null) {
    return;
  }
  if (document.fullscreenElement === null) {
    button.textContent = "Pantalla completa";
  } else {
    button.textContent = "Salir de pantalla";
  }
}

document.addEventListener("fullscreenchange", () => {
  updateFullscreenButton();
});

document.querySelector("#fullscreen-toggle-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  if (document.fullscreenElement === null) {
    document.body.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

const GAME_BACKGROUND_COUNT = 4;
function pickGameBackground(): void {
  const n = Math.floor(Math.random() * GAME_BACKGROUND_COUNT) + 1;
  const gameScreenEl = document.querySelector("#game-screen") as HTMLElement | null;
  if (gameScreenEl !== null) {
    gameScreenEl.style.backgroundImage = "url(\"img/backgrounds/fondoJuego" + n + ".webp\")";
  }
}

function beginGame(name: string, totalDays: number, hardMode: boolean, randomFn: () => number, dayDurationMs: number): void {
  game = new Game(name, totalDays, hardMode, randomFn);
  streak = 0;
  maxStreakToday = 0;
  dayStreaks = [];
  saveDayStreaks(dayStreaks);
  DAY_DURATION_MS = dayDurationMs;
  pickGameBackground();
  game.loadData(() => {
    if (game === null) {
      return;
    }
    game.startNewGame();
    renderStoryScreen();
    changeState("story");
  });
}

const ONLY_LETTERS_REGEX = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü ]+$/;

document.querySelector("#player-name-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#player-name-input") as HTMLInputElement | null;
  const errorText = document.querySelector("#player-name-error");
  const name = input?.value.trim() ?? "";

  if (name === "" || !ONLY_LETTERS_REGEX.test(name)) {
    errorText?.classList.remove("hidden");
    return;
  }
  errorText?.classList.add("hidden");

  soundManager.playNextButton();
  input?.blur();
  savePlayerName(name);

  const durationMs = hardModeSelected ? DAY_DURATION_OPTIONS_MS[0] : selectedDayDurationMs;
  beginGame(name, selectedTotalDays, hardModeSelected, Math.random, durationMs);
});

function updateHardModeButton(): void {
  const button = document.querySelector("#hard-mode-toggle-btn");
  if (button !== null) {
    button.textContent = hardModeSelected ? "Modo difícil: ON" : "Modo difícil: OFF";
    button.setAttribute("aria-pressed", String(hardModeSelected));
    button.classList.toggle("active", hardModeSelected);
  }
  const durationSlider = document.querySelector("#day-duration-slider") as HTMLInputElement | null;
  if (durationSlider !== null) {
    durationSlider.disabled = hardModeSelected;
  }
}

document.querySelector("#hard-mode-toggle-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  hardModeSelected = !hardModeSelected;
  updateHardModeButton();
});

document.querySelector("#daily-challenge-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  const name = loadPlayerName() || "Un1c0rN10";
  beginGame(name, 7, false, mulberry32(todayChallengeSeed()), DAY_DURATION_OPTIONS_MS[1]);
});

let backLinkTarget: string = "menu";

document.querySelectorAll(".back-link").forEach(button => {
  button.addEventListener("click", () => {
    soundManager.playNextButton();
    changeState(backLinkTarget);
  });
});

document.querySelectorAll(".exit-to-menu-btn:not(#pause-btn)").forEach(button => {
  button.addEventListener("click", () => {
    soundManager.playNextButton();
    soundManager.stopWrite();
    dayTimer.clear();
    stopDialogue();
    introBeatIndex = null;
    errorReactionPending = false;
    changeState("menu");
    renderHistoryTable();
    updateContinueButton();
  });
});

document.querySelector("#pause-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  dayTimer.pause();
  changeState("pause");
});

document.querySelector("#pause-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  changeState("game");
  dayTimer.resume(timerEnabled);
});

initShop(() => game, () => timerEnabled, soundManager, dayTimer, changeState);

document.querySelector("#pause-options-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  backLinkTarget = "pause";
  document.querySelector("#new-game-options")?.classList.add("hidden");
  changeState("options");
});

document.querySelector("#options-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  backLinkTarget = "menu";
  document.querySelector("#new-game-options")?.classList.remove("hidden");
  changeState("options");
});

document.querySelector("#exit-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  backLinkTarget = "menu";
  changeState("exit");
});

document.querySelector("#close-window-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  window.close();
});

document.querySelector("#credits-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  backLinkTarget = "menu";
  renderCreditsScreen();
  changeState("credits");
});

document.querySelector("#new-game-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  const input = document.querySelector("#player-name-input") as HTMLInputElement | null;
  if (input !== null) {
    input.value = loadPlayerName();
  }
  changeState("name-entry");
});

function renderStoryScreen(): void {
  if (game === null) {
    return;
  }
  const text = "Bienvenido, detective " + game.playerName + ". Eres un nuevo oficial de la Agencia de Aduana Espiritual, contratado el mismo día en que empieza tu turno (Día 1). Tu trabajo es revisar los pasaportes de quienes cruzan hacia el mundo humano y decidir si los dejas pasar, según las reglas que la agencia va confirmando día a día sobre los Yokai.";
  typeDialogue(text, "#story-text");
}

type TutorialVisual = "passport" | "stamps" | "hud";
type StoryBeat = { image?: string; text: string; tutorial?: TutorialVisual; buttonLabel?: string };

const DAY_ONE_INTRO_BEATS: StoryBeat[] = [
  { image: "jefaPresentacion", text: "Es tu primer día en la agencia espiritual. Nadie te dio un manual de bienvenida, no lo necesitas porque en tu currículum dice que tienes mucha experiencia." },
  { image: "jefaNeutral", text: "La regla es muy clara: PROHIBIDA LA ENTRADA A QUIEN TENGA CUERNOS. Los oni no pasan." },
  { tutorial: "passport", text: "Cuando un espíritu te arroje su pasaporte, clica sobre él para abrirlo y ver la información." },
  { tutorial: "stamps", text: "Estos son los 2 sellos que usarás por ahora. El rojo es para rechazar y el verde para aceptar. Arrastra el que quieras usar y suéltalo sobre el pasaporte." },
  { tutorial: "hud", text: "La moneda te dirá el dinero que ganarás. El reloj te indicará el tiempo que te resta. En la tienda puedes comprar más tiempo o un indulto si tienes muchas fallas." },
  { image: "jefaExplica-1", text: "Mucha suerte en tu primer día, detective.", buttonLabel: "Continuar" },
];

let introBeatIndex: number | null = null;

function renderJefaBeat(beat: StoryBeat): void {
  const jefaEl = document.querySelector("#jefa-portrait");
  if (jefaEl !== null) jefaEl.className = beat.image ?? "";

  const sceneEl = document.querySelector("#jefa-scene");
  const tutorialEl = document.querySelector("#tutorial-visual");
  if (sceneEl !== null && tutorialEl !== null) {
    sceneEl.classList.remove("tutorial-passport", "tutorial-stamps", "tutorial-hud");
    if (beat.tutorial === undefined) {
      tutorialEl.classList.add("hidden");
      tutorialEl.setAttribute("aria-hidden", "true");
    } else {
      sceneEl.classList.add("tutorial-" + beat.tutorial);
      tutorialEl.classList.remove("hidden");
      tutorialEl.setAttribute("aria-hidden", "false");
    }
  }

  const kickerEl = document.querySelector<HTMLElement>("#notice-kicker");
  kickerEl?.classList.toggle("hidden", beat.tutorial !== undefined);

  tutorialEl?.querySelectorAll<HTMLElement>("[data-tutorial-visual]").forEach((visualEl) => {
    visualEl.style.display = visualEl.dataset.tutorialVisual === beat.tutorial ? "block" : "none";
  });

  const continueButton = document.querySelector("#continue-day-btn");
  if (continueButton !== null) {
    continueButton.textContent = beat.buttonLabel ?? "Siguiente";
  }

  const summaryEl = document.querySelector("#day-result-summary") as HTMLElement | null;
  if (summaryEl !== null) summaryEl.classList.add("hidden");

  typeDialogue(beat.text, "#next-day-message");
}

function setNoticeType(type: string): void {
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
  soundManager.playNextButton();
  introBeatIndex = 0;
  changeState("day-result");
  setNoticeType("rule");
  renderJefaBeat(DAY_ONE_INTRO_BEATS[0]);
});

document.querySelector("#continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  game = new Game(loadPlayerName());
  streak = 0;
  maxStreakToday = 0;
  dayStreaks = loadDayStreaks();
  const savedGame = loadCurrentGame();
  DAY_DURATION_MS = (savedGame !== null && savedGame.hardMode) ? DAY_DURATION_OPTIONS_MS[0] : selectedDayDurationMs;
  pickGameBackground();
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

let errorReactionPending = false;

function renderVisitor(): void {
  if (game === null || game.currentVisitor === null) {
    return;
  }

  dayTimer.markResolving();

  resetElementOffscreen(CHARACTER_ELEMENT);

  setDecisionStampsEnabled(false);

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
    passportEl.style.display = "none";
    passportEl.classList.remove("open", "delivered", "passport-details-visible", ...PASSPORT_DESK_LOOK_VARIANTS);
    passportEl.classList.add("closed");
  }

  window.setTimeout(() => {
    if (passportEl !== null) {
      passportEl.style.display = "";
      passportEl.style.left = PASSPORT_ARC_BASE.left + "%";
      passportEl.style.top = PASSPORT_ARC_BASE.top + "%";
      passportEl.style.height = PASSPORT_ARC_BASE.height + "%";

      animatePassportAlongArc(PASSPORT_ARC_BASE, PASSPORT_ARC_CONTROL, PASSPORT_ARC_DESK, PASSPORT_ARC_MS, PASSPORT_ARC_EASING, true, () => {
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

  const dayEl = document.querySelector("#day-counter");
  const errorsEl = document.querySelector("#error-counter") as HTMLElement | null;
  const moneyEl = document.querySelector("#money-counter");
  const streakEl = document.querySelector("#streak-counter");
  const sceneEl = document.querySelector("#character-scene") as HTMLElement | null;

  const dangerThreshold = game.maxErrors - 1;
  if (dayEl !== null) dayEl.textContent = game.dayNumber + " / " + game.totalDays;
  if (errorsEl !== null) {
    errorsEl.textContent = game.errors + " / " + game.maxErrors;
    if (game.errors >= dangerThreshold) {
      errorsEl.classList.add("danger");
    } else {
      errorsEl.classList.remove("danger");
    }
  }
  if (sceneEl !== null) {
    if (game.errors >= dangerThreshold) {
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
    streak = 0;
    maxStreakToday = 0;
    changeState("day-summary");
    renderDaySummaryScreen(dayBefore, dayMaxStreak);
    return;
  }

  renderVisitor();
}

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
  soundManager.playWrite();
  renderJefaBeat(accept ? reactions.throughReaction : reactions.rejectedReaction);
  errorReactionPending = true;
  dayTimer.pause();
  changeState("day-result");
}

function resolveDecision(accept: boolean, usedAlienStamp: boolean = false): void {
  if (game === null) {
    return;
  }

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

  window.setTimeout(() => {
    if (decisionStampEl !== null) {
      decisionStampEl.classList.remove("show", "approved", "rejected", "alien");
    }
    if (passportEl !== null) {
            passportEl.classList.remove("open", "delivered", "passport-details-visible", ...PASSPORT_DESK_LOOK_VARIANTS);
      passportEl.classList.add("closed");
    }

    window.setTimeout(() => {
      animatePassportAlongArc(PASSPORT_ARC_DESK, PASSPORT_ARC_CONTROL, PASSPORT_ARC_BASE, PASSPORT_ARC_MS, PASSPORT_ARC_EASING, false, () => {
        if (passportEl !== null) {
          passportEl.style.left = "";
          passportEl.style.top = "";
          passportEl.style.height = "";
          passportEl.style.display = "none";
          passportEl.style.transition = "";
        }

        slideOutSlidingElements(direction, PORTRAIT_ANIM_MS, () => {
          const dayEndedWhileResolving = dayTimer.releaseResolving();
          if (game === null) {
            return;
          }
          game.decide(accept, usedAlienStamp);

          const justErred = game.errors > errorsBefore;
          if (justErred) {
            streak = 0;
            if (!game.isLost()) {
              soundManager.playWrong();
            }
          } else {
            streak += 1;
            if (streak > maxStreakToday) {
              maxStreakToday = streak;
            }
          }

          if (dayEndedWhileResolving) {
            if (!game.isLost() && !game.isWon()) {
              game.endDay();
            }
          }

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

initStampDrag(soundManager, resolveDecision);

const DAY_END_MESSAGES: string[] = [
  "Ha finalizado el día. Vas camino a casa, feliz con tu nuevo empleo.",
  "Ha finalizado tu jornada. Ahora ves que se te está exigiendo más... te duelen los pies y las manos de tanto sellar.",
  "Final de la jornada. Ahora no puedes esperar para estar en casa, llorar un poco y dormir... mucha suerte.",
  "Final de la jornada. Hoy no estás tan agotado... además, la Jefa te ha hecho un cumplido, te sientes afortunado.",
  "Fin de la jornada... tratas de convencerte de que la paga es buena... aunque realmente no lo es...",
  "Jornada de trabajo terminada... día agotador, pero te tranquiliza la idea de que solo te quedan 45 años para jubilarte... suerte.",
  "Fin del día 7... buen trabajo.",
];

const DAY_END_IMAGES: { file: string; backdrop: boolean }[] = [
  { file: "pantallaIntermedia1.webp", backdrop: true },
  { file: "pantallaIntermedia2.webp", backdrop: true },
  { file: "pantallaIntermedia3.webp", backdrop: true },
  { file: "pantallaIntermedia5.webp", backdrop: true },
  { file: "pantallaIntermedia4.webp", backdrop: false },
  { file: "pantallaIntermedia0.webp", backdrop: true },
  { file: "pantallaIntermedia6.webp", backdrop: false },
];

function renderDaySummaryScreen(dayNumber: number, maxStreak: number): void {
  if (game === null) {
    return;
  }
  const numberEl = document.querySelector("#day-summary-number");
  if (numberEl !== null) {
    numberEl.textContent = String(dayNumber);
  }
  const dayImage = DAY_END_IMAGES[dayNumber - 1];
  const portraitEl = document.querySelector<HTMLElement>("#day-end-portrait");
  if (portraitEl !== null) {
    portraitEl.style.backgroundImage = "url(\"img/backgrounds/" + dayImage.file + "\")";
  }
  const backdropEl = document.querySelector<HTMLElement>("#day-end-backdrop");
  if (backdropEl !== null) {
    backdropEl.classList.toggle("hidden", !dayImage.backdrop);
  }
  typeDialogue(DAY_END_MESSAGES[dayNumber - 1], "#day-summary-text");

  const continueBtn = document.querySelector("#day-summary-continue-btn");
  if (continueBtn !== null) {
    continueBtn.textContent = game.isWon() ? "Finalizar semana" : "Siguiente día";
  }

  const statsEl = document.querySelector("#day-summary-stats");
  if (statsEl === null) {
    return;
  }
  statsEl.innerHTML = "";
  const money = game.lastDayMoney;
  const charge = game.lastDayCharge;
  const stats = [
    "Aceptados: " + game.lastDayAccepted,
    "Rechazados: " + game.lastDayRejected,
    "Errores: " + game.lastDayErrors,
    "Racha máxima: " + maxStreak,
    "Dinero ganado: " + (money >= 0 ? "+" : "") + money,
  ];
  if (charge > 0) {
    stats.push("Cobro diario: -" + charge);
  }
  stats.forEach(line => {
    const item = document.createElement("li");
    item.textContent = line;
    statsEl.appendChild(item);
  });
}

document.querySelector("#day-summary-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  if (game === null) {
    return;
  }
  if (game.isWon()) {
    renderFinalScreen();
    changeState("final");
    return;
  }
  changeState("day-result");
  renderDayResultScreen();
});

function renderDayResultScreen(showSummary: boolean = true): void {
  if (game === null) {
    return;
  }

  const sceneEl = document.querySelector("#jefa-scene");
  const tutorialEl = document.querySelector("#tutorial-visual");
  sceneEl?.classList.remove("tutorial-passport", "tutorial-stamps", "tutorial-hud");
  tutorialEl?.classList.add("hidden");
  tutorialEl?.setAttribute("aria-hidden", "true");
  const summaryEl = document.querySelector("#day-result-summary");
  const messageEl = document.querySelector("#next-day-message");

  if (summaryEl !== null) {
    const summaryHtmlEl = summaryEl as HTMLElement;
    if (showSummary) {
      summaryHtmlEl.classList.remove("hidden");
      summaryEl.textContent = "Errores acumulados: " + game.errors + " / " + game.maxErrors + " — Dinero: " + game.money;
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

document.querySelector("#continue-day-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  soundManager.stopWrite();
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

  const activeRules = game.currentDay.getActiveRules();
  const bannedSpecies = activeRules
    .filter(rule => rule.getProperty() === "especieProhibida")
    .map(rule => String(rule.getForbiddenValue()));
  let bannedSpeciesShown = false;

  activeRules.forEach(rule => {
    if (rule.getProperty() === "especieProhibida") {
      if (bannedSpeciesShown) {
        return;
      }
      bannedSpeciesShown = true;
      const item = document.createElement("li");
      item.textContent = "Rechazar si el pasaporte declara la especie: " + bannedSpecies.join(", ") + ".";
      rulesEl.appendChild(item);
      return;
    }
    const item = document.createElement("li");
    item.textContent = rule.getDescription();
    rulesEl.appendChild(item);
  });
}

document.querySelector("#day-start-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  changeState("game");
  renderVisitor();
  dayTimer.start(DAY_DURATION_MS, timerEnabled);
});

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

const ENDING_YOKAI: EndingBeat[] = [
  { backdrop: "yokai", portrait: null, award: null, text: "Has perdido demasiadas veces consecutivas, te conviertes en yokai y eres tú quien desata el apocalipsis... la jefa llora porque te amaba en secreto... GAME OVER" },
  { backdrop: "yokai", portrait: null, award: null, text: "Del otro lado del mostrador ya no queda nada tuyo: la agencia borró tu expediente completo. Se eliminaron TODAS las partidas guardadas." },
];

const ENDING_BOSS: EndingBeat[] = [
  { backdrop: "boss", portrait: null, award: null, text: "Has ascendido a jefe... a la inspectora la han degradado a tu puesto... finalmente la vida te sonríe." },
  { backdrop: "boss-worried", portrait: null, award: null, text: "La antigua jefa no puede mantener su lujoso estilo de vida con su nuevo sueldo.... FIN" },
];

const ENDING_RICH_BOSS: EndingBeat[] = [
  { backdrop: "rich-boss", portrait: null, award: null, text: "Lo has hecho muy bien... Tan bien que la jefa ahora gana mucho dinero y puede permitirse la vida que siempre soñó!... a ti... te dan un pequeño bono al final del año... siempre tienes hambre... FIN?" },
];

const CONSECUTIVE_FOR_SPECIAL_ENDING = 3;

const RICH_BOSS_MONEY = 300;

function awardBeat(award: string, text: string): EndingBeat {
  return { backdrop: "blurred-office", portrait: null, award: award, text: text };
}

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
    awardEl.style.animation = "none";
    void awardEl.offsetWidth;
    awardEl.style.animation = "";
  }

  typeDialogue(beat.text, "#final-message");

  const hasMoreBeats = endingBeatIndex < endingBeats.length - 1;
  const continueBtn = document.querySelector("#final-continue-btn") as HTMLElement | null;
  const backBtn = document.querySelector("#back-to-menu-btn") as HTMLElement | null;
  const shareBtn = document.querySelector("#share-result-btn") as HTMLElement | null;
  if (continueBtn !== null) continueBtn.classList.toggle("hidden", !hasMoreBeats);
  if (backBtn !== null) backBtn.classList.toggle("hidden", hasMoreBeats);
  if (shareBtn !== null) shareBtn.classList.toggle("hidden", hasMoreBeats);
}

function buildResultCard(finished: Game): string {
  const dayReached = finished.isWon() ? finished.totalDays : finished.dayNumber;
  const lines = [
    "Yokai Inspector 🔍",
    (finished.isWon() ? "Victoria 🏆" : "Derrota 💀") + " — Día " + dayReached + " / " + finished.totalDays,
    "❌ " + finished.errors + " errores · 💰 $" + finished.money + (finished.hardMode ? " · 🔥 Difícil" : ""),
  ];
  const leaked: string[] = [];
  if (finished.letThroughOni) leaked.push("👹");
  if (finished.letThroughKitsune) leaked.push("🦊");
  if (finished.letThroughKappa) leaked.push("🐸");
  if (leaked.length > 0) {
    lines.push("Se me colaron: " + leaked.join(" "));
  }
  return lines.join("\n");
}

document.querySelector("#share-result-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  if (game === null) {
    return;
  }
  const button = document.querySelector("#share-result-btn");
  const card = buildResultCard(game);
  if (navigator.clipboard === undefined) {
    if (button !== null) {
      button.textContent = "No se pudo copiar";
      window.setTimeout(() => { button.textContent = "Copiar resultado"; }, 1500);
    }
    return;
  }
  navigator.clipboard.writeText(card).then(() => {
    if (button !== null) {
      button.textContent = "¡Copiado!";
      window.setTimeout(() => { button.textContent = "Copiar resultado"; }, 1500);
    }
  }).catch(() => {
    if (button !== null) {
      button.textContent = "No se pudo copiar";
      window.setTimeout(() => { button.textContent = "Copiar resultado"; }, 1500);
    }
  });
});

function renderFinalScreen(): void {
  if (game === null) {
    return;
  }

  const resultStreak = getResultStreak();
  const repeatedResult = resultStreak.count >= CONSECUTIVE_FOR_SPECIAL_ENDING;

  if (!game.isWon()) {
    const seConvierteEnYokai = repeatedResult && resultStreak.result === "derrota";
    endingBeats = seConvierteEnYokai ? ENDING_YOKAI : ENDING_DEFEAT;
    soundManager.playLose();
    if (seConvierteEnYokai) {
      clearSavedGames();
    }
  } else if (repeatedResult && resultStreak.result === "victoria") {
    endingBeats = ENDING_BOSS;
    soundManager.playVictory();
  } else if (game.money >= RICH_BOSS_MONEY) {
    endingBeats = ENDING_RICH_BOSS;
    soundManager.playVictory();
  } else if (game.errors <= 1) {
    endingBeats = ENDING_WIN_SPECIAL;
    soundManager.playVictory();
  } else {
    endingBeats = ENDING_WIN_REGULAR;
    soundManager.playVictory();
  }
  endingBeats = endingBeats.concat(buildAwardBeats());
  endingBeatIndex = 0;
  renderEndingBeat();
}

document.querySelector("#final-continue-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  endingBeatIndex += 1;
  renderEndingBeat();
});

document.querySelector("#back-to-menu-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  changeState("menu");
  renderHistoryTable();
  updateContinueButton();
});

document.querySelector("#clear-history-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  if (!window.confirm("¿Borrar la partida en curso, el historial y las rachas? No se puede deshacer.")) {
    return;
  }
  clearSavedGames();
  renderHistoryTable();
  updateContinueButton();
});

document.querySelector("#clear-credits-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  if (!window.confirm("¿Borrar el ranking de créditos de todos los inspectores? No se puede deshacer.")) {
    return;
  }
  clearCredits();
  renderCreditsScreen();
});

updateContinueButton();
updateTimerToggleButton();
updateHardModeButton();
renderHistoryTable();
preloadCharacterImages();
startCoinSpin();
initMenuYokai();
initKeyboardNav(() => currentState);
focusFirstControl("start-gate");
