const CURRENT_GAME_KEY = "yokaiInspector_currentGame";
const HISTORY_KEY = "yokaiInspector_history";
const HISTORY_LIMIT = 3;
const PLAYER_NAME_KEY = "yokaiInspector_playerName";
const CREDITS_KEY = "yokaiInspector_credits";
const DAY_STREAKS_KEY = "yokaiInspector_dayStreaks";
const RESULT_STREAK_KEY = "yokaiInspector_resultStreak";
export function saveCurrentGame(data) {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(data));
}
export function loadCurrentGame() {
    const rawData = localStorage.getItem(CURRENT_GAME_KEY);
    if (rawData === null) {
        return null;
    }
    return JSON.parse(rawData);
}
export function deleteCurrentGame() {
    localStorage.removeItem(CURRENT_GAME_KEY);
}
export function saveToHistory(result) {
    const history = getHistory();
    history.unshift(result);
    const trimmedHistory = history.slice(0, HISTORY_LIMIT);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
}
export function getHistory() {
    const rawData = localStorage.getItem(HISTORY_KEY);
    if (rawData === null) {
        return [];
    }
    return JSON.parse(rawData);
}
export function savePlayerName(name) {
    localStorage.setItem(PLAYER_NAME_KEY, name);
}
export function loadPlayerName() {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}
export function addCredits(name, amount) {
    const credits = getAllCredits();
    const previous = credits[name] ?? 0;
    credits[name] = previous + amount;
    localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
}
export function getAllCredits() {
    const rawData = localStorage.getItem(CREDITS_KEY);
    if (rawData === null) {
        return {};
    }
    return JSON.parse(rawData);
}
// borra SOLO el ranking de creditos acumulados por jugador (CREDITS_KEY). No
// toca la partida en curso, el historial ni las rachas: eso lo hace
// clearSavedGames(), son cosas separadas a proposito. La usa el boton "Borrar
// créditos" de la pantalla de creditos.
export function clearCredits() {
    localStorage.removeItem(CREDITS_KEY);
}
// racha con la que termino cada dia de la partida en curso (un numero por dia
// jugado, en orden) - todavia sin usarse para nada mas que guardarla; queda
// preparada para una idea a futuro (ver docs/ideas.md): un final alternativo
// si la racha de todos los dias fue perfecta o pasa cierto umbral.
export function saveDayStreaks(streaks) {
    localStorage.setItem(DAY_STREAKS_KEY, JSON.stringify(streaks));
}
export function loadDayStreaks() {
    const rawData = localStorage.getItem(DAY_STREAKS_KEY);
    if (rawData === null) {
        return [];
    }
    return JSON.parse(rawData);
}
// cuantas partidas SEGUIDAS terminaron con el mismo resultado (no confundir con
// saveDayStreaks, que es la racha de aciertos DENTRO de una partida). La usan los
// finales que dependen de haber ganado o perdido 3 veces consecutivas, ver
// ENDING_* en main.ts. Se llama una sola vez por partida terminada, desde Game.
export function addResultToStreak(result) {
    const previous = getResultStreak();
    const count = previous.result === result ? previous.count + 1 : 1;
    localStorage.setItem(RESULT_STREAK_KEY, JSON.stringify({ result: result, count: count }));
    return count;
}
// borra todo lo guardado de partidas: el historial, la partida en curso y las
// dos rachas. NO toca los creditos acumulados por jugador, que son un ranking
// aparte y no una "partida guardada". Lo usa el final de convertirse en yokai.
export function clearSavedGames() {
    localStorage.removeItem(CURRENT_GAME_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(DAY_STREAKS_KEY);
    localStorage.removeItem(RESULT_STREAK_KEY);
}
export function getResultStreak() {
    const rawData = localStorage.getItem(RESULT_STREAK_KEY);
    if (rawData === null) {
        return { result: "", count: 0 };
    }
    return JSON.parse(rawData);
}
//# sourceMappingURL=Storage.js.map