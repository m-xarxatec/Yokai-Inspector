const CURRENT_GAME_KEY = "yokaiInspector_currentGame";
const HISTORY_KEY = "yokaiInspector_history";
const HISTORY_LIMIT = 3;
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
//# sourceMappingURL=Storage.js.map