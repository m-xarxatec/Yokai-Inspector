import { Game } from "./classes/Game.js";
import { loadCurrentGame, getHistory } from "./Storage.js";
let game = null;
let currentState = "menu";
function changeState(newState) {
    currentState = newState;
    document.querySelectorAll("section").forEach(section => {
        section.classList.add("hidden");
    });
    document.querySelector(`#${newState}-screen`)?.classList.remove("hidden");
}
// --- Menu screen ---
function updateContinueButton() {
    const boton = document.querySelector("#continue-btn");
    if (boton === null) {
        return;
    }
    boton.disabled = loadCurrentGame() === null;
}
function renderHistoryTable() {
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
function renderVisitor() {
    if (game === null || game.currentVisitor === null) {
        return;
    }
    const visitante = game.currentVisitor;
    const pasaporte = visitante.obtainPassport;
    const nombreEl = document.querySelector("#passport-name");
    const regionEl = document.querySelector("#passport-region");
    const especieEl = document.querySelector("#passport-species");
    const selloEl = document.querySelector("#passport-stamp");
    if (nombreEl !== null)
        nombreEl.textContent = pasaporte.obtainName;
    if (regionEl !== null)
        regionEl.textContent = pasaporte.obtainRegion;
    if (selloEl !== null)
        selloEl.textContent = pasaporte.obtainStamp;
    // la especie declarada recien se revela a partir del dia 4 (ver mensajeIntro de ese dia)
    if (especieEl !== null) {
        const especieHtmlEl = especieEl;
        if (game.dayNumber >= 4) {
            especieHtmlEl.style.display = "";
            especieEl.textContent = pasaporte.obtainDeclaredSpecie;
        }
        else {
            especieHtmlEl.style.display = "none";
        }
    }
    const dialogoEl = document.querySelector("#dialogue-bubble");
    if (dialogoEl !== null) {
        dialogoEl.textContent = visitante.dialogueLine();
    }
    const faceEl = document.querySelector(".part-face");
    const eyesEl = document.querySelector(".part-eyes");
    const mouthEl = document.querySelector(".part-mouth");
    const hairEl = document.querySelector(".part-hair");
    const hornsEl = document.querySelector(".part-horns");
    if (faceEl !== null)
        faceEl.className = "part part-face " + visitante.obtainFace;
    if (eyesEl !== null) {
        const eyesVariant = visitante.obtainYellowEyes ? "yellowEyes" : visitante.obtainEyes;
        eyesEl.className = "part part-eyes " + eyesVariant;
    }
    if (mouthEl !== null)
        mouthEl.className = "part part-mouth " + visitante.obtainMouth;
    if (hairEl !== null)
        hairEl.className = "part part-hair " + visitante.obtainHair;
    if (hornsEl !== null) {
        if (visitante.obtainHaveHorns) {
            hornsEl.className = "part part-horns " + visitante.obtainHorns;
            hornsEl.style.display = "";
        }
        else {
            hornsEl.style.display = "none";
        }
    }
    const diaEl = document.querySelector("#day-counter");
    const erroresEl = document.querySelector("#error-counter");
    const dineroEl = document.querySelector("#money-counter");
    if (diaEl !== null)
        diaEl.textContent = "Día " + game.dayNumber + " / 5";
    if (erroresEl !== null)
        erroresEl.textContent = "Errores: " + game.errors + " / 5";
    if (dineroEl !== null)
        dineroEl.textContent = "Dinero: " + game.money;
}
function afterDecision(diaAntes) {
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
function renderDayResultScreen() {
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
function renderFinalScreen() {
    if (game === null) {
        return;
    }
    const mensajeEl = document.querySelector("#final-message");
    if (mensajeEl === null) {
        return;
    }
    if (game.isWon()) {
        mensajeEl.textContent = "¡Salvaste el mundo! Como agradecimiento, la agencia te asciende a Jefe de Sección (con oficina nueva, aunque sin ventana) y además te regalan un unicornio de peluche gigante que insiste en llamarse \"Su Majestad\".";
    }
    else if (game.isLost()) {
        mensajeEl.textContent = "Te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo.";
    }
}
document.querySelector("#back-to-menu-btn")?.addEventListener("click", () => {
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
        .then(partes => {
        const rostroUrls = partes.rostro.map((nombre) => "img/baseCharacters/" + nombre + ".png");
        const ojosUrls = partes.ojos.map((nombre) => "img/eyes/" + nombre + ".png");
        preloadImages(rostroUrls);
        preloadImages(ojosUrls);
        preloadImages(["img/eyes/" + partes.ojosAmarillos + ".png"]);
    })
        .catch(error => console.log("no se pudieron precargar las imagenes", error));
}
// --- Estado inicial al cargar la página ---
updateContinueButton();
renderHistoryTable();
preloadCharacterImages();
//# sourceMappingURL=main.js.map