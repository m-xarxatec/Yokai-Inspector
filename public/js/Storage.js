const CURRENT_GAME_KEY = "yokaiInspector_currentGame";
const HISTORY_KEY = "yokaiInspector_history";
const HISTORY_LIMIT = 3;
const PLAYER_NAME_KEY = "yokaiInspector_playerName";
const CREDITS_KEY = "yokaiInspector_credits";
const DAY_STREAKS_KEY = "yokaiInspector_dayStreaks";
const RESULT_STREAK_KEY = "yokaiInspector_resultStreak";
// varias funciones de aca abajo repetian el mismo patron: leer una key de
// localStorage, y si no habia nada guardado todavia devolver un valor por
// defecto en vez de romper con JSON.parse(null) - juntado en un solo lugar
function loadJson(key, fallback) {
    const rawData = localStorage.getItem(key);
    if (rawData === null) {
        return fallback;
    }
    return JSON.parse(rawData);
}
export function saveCurrentGame(data) {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(data));
}
export function loadCurrentGame() {
    return loadJson(CURRENT_GAME_KEY, null);
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
    return loadJson(HISTORY_KEY, []);
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
    return loadJson(CREDITS_KEY, {});
}
export function saveDayStreaks(streaks) {
    localStorage.setItem(DAY_STREAKS_KEY, JSON.stringify(streaks));
}
export function loadDayStreaks() {
    return loadJson(DAY_STREAKS_KEY, []);
}
export function addResultToStreak(result) {
    const previous = getResultStreak();
    const count = previous.result === result ? previous.count + 1 : 1;
    localStorage.setItem(RESULT_STREAK_KEY, JSON.stringify({ result: result, count: count }));
    return count;
}
export function clearSavedGames() {
    localStorage.removeItem(CURRENT_GAME_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(DAY_STREAKS_KEY);
    localStorage.removeItem(RESULT_STREAK_KEY);
}
export function getResultStreak() {
    return loadJson(RESULT_STREAK_KEY, { result: "", count: 0 });
}
//# sourceMappingURL=Storage.js.map