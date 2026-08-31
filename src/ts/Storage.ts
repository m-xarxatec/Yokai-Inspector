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
function loadJson(key: string, fallback: any): any {
  const rawData = localStorage.getItem(key);
  if (rawData === null) {
    return fallback;
  }
  return JSON.parse(rawData);
}

export function saveCurrentGame(data: any): void {
  localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(data));
}

export function loadCurrentGame(): any {
  return loadJson(CURRENT_GAME_KEY, null);
}

export function deleteCurrentGame(): void {
  localStorage.removeItem(CURRENT_GAME_KEY);
}

export function saveToHistory(result: any): void {
  const history = getHistory();
  history.unshift(result);
  const trimmedHistory = history.slice(0, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
}

export function getHistory(): any[] {
  return loadJson(HISTORY_KEY, []);
}

export function savePlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function loadPlayerName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function addCredits(name: string, amount: number): void {
  const credits = getAllCredits();
  const previous = credits[name] ?? 0;
  credits[name] = previous + amount;
  localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
}

export function getAllCredits(): Record<string, number> {
  return loadJson(CREDITS_KEY, {});
}

export function saveDayStreaks(streaks: number[]): void {
  localStorage.setItem(DAY_STREAKS_KEY, JSON.stringify(streaks));
}

export function loadDayStreaks(): number[] {
  return loadJson(DAY_STREAKS_KEY, []);
}

export function addResultToStreak(result: string): number {
  const previous = getResultStreak();
  const count = previous.result === result ? previous.count + 1 : 1;
  localStorage.setItem(RESULT_STREAK_KEY, JSON.stringify({ result: result, count: count }));
  return count;
}

export function clearSavedGames(): void {
  localStorage.removeItem(CURRENT_GAME_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(DAY_STREAKS_KEY);
  localStorage.removeItem(RESULT_STREAK_KEY);
}

export function getResultStreak(): any {
  return loadJson(RESULT_STREAK_KEY, { result: "", count: 0 });
}
