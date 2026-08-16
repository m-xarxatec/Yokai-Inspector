const CURRENT_GAME_KEY = "yokaiInspector_currentGame";
const HISTORY_KEY = "yokaiInspector_history";
const HISTORY_LIMIT = 3;
const PLAYER_NAME_KEY = "yokaiInspector_playerName";
const CREDITS_KEY = "yokaiInspector_credits";
const DAY_STREAKS_KEY = "yokaiInspector_dayStreaks";
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
//# sourceMappingURL=Storage.js.map