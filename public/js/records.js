import { getAllCredits, getHistory } from "./Storage.js";
export function renderCreditsScreen() {
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
export function renderHistoryTable() {
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
        dayCell.textContent = "Día " + entry.day + " / " + (entry.totalDays ?? 7);
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
        // tipo de partida - las partidas guardadas de antes del modo dificil no
        // traen el dato, se leen como "Normal"
        const modeCell = document.createElement("td");
        modeCell.textContent = entry.hardMode ? "Difícil" : "Normal";
        if (entry.hardMode) {
            modeCell.className = "mode-hard";
        }
        row.appendChild(modeCell);
        table.appendChild(row);
    });
}
//# sourceMappingURL=records.js.map