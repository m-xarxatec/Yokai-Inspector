// ARCHIVO TEMPORAL DE PRUEBA - se borra al terminar de testear, no es parte del proyecto entregable.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");

let store = {};

function resetMocks() {
  store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; }
  };
}

global.fetch = async (url) => {
  const filePath = path.join(publicDir, url);
  const content = readFileSync(filePath, "utf-8");
  return { json: async () => JSON.parse(content) };
};

resetMocks();

const { Game } = await import("./public/js/classes/Game.js");
const { getHistory } = await import("./public/js/Storage.js");

function loadDataAsync(game) {
  return new Promise((resolve) => game.loadData(resolve));
}

function describeVisitor(character) {
  const p = character.obtainPassport;
  return {
    name: character.obtainName,
    horns: character.obtainHaveHorns,
    yellowEyes: character.obtainYellowEyes,
    region: p.obtainRegion,
    declared: p.obtainDeclaredSpecie,
    stamp: p.obtainStamp,
    liar: character.specieLiar()
  };
}

const expectedRuleCounts = [1, 2, 3, 4, 5];
const expectedProblematicCounts = [2, 3, 4, 5, 5];

// ================= TEST 1: partida "perfecta" (siempre acierta) =================
console.log("\n========== TEST 1: partida perfecta, hasta victoria ==========");
resetMocks();
const gameA = new Game();
await loadDataAsync(gameA);
gameA.startNewGame();
console.log("dia inicial:", gameA.dayNumber, "(esperado 1)");
console.log("dinero inicial:", gameA.money, "(esperado 10)");
console.log("errores iniciales:", gameA.errors, "(esperado 0)");
console.log("visitante generado al cargar:", gameA.currentVisitor ? "SI" : "FALLO: no hay visitante");

const visitorLog = [];
const dayAudit = [];
let currentDayTracked = 1;
let currentDayRuleCount = gameA.currentDay.getActiveRules().length;
let problematicSeenThisDay = 0;
let visitorsThisDay = 0;

while (!gameA.isWon() && !gameA.isLost()) {
  const day = gameA.currentDay;
  if (day.getNumber() !== currentDayTracked) {
    dayAudit.push({ day: currentDayTracked, rules: currentDayRuleCount, problematic: problematicSeenThisDay, visitors: visitorsThisDay });
    currentDayTracked = day.getNumber();
    currentDayRuleCount = day.getActiveRules().length;
    problematicSeenThisDay = 0;
    visitorsThisDay = 0;
  }
  const visitor = gameA.currentVisitor;
  const violation = day.evaluateCharacter(visitor);
  const shouldAccept = violation === null;

  visitorLog.push({ day: day.getNumber(), ...describeVisitor(visitor), rejected: !shouldAccept });
  if (!shouldAccept) problematicSeenThisDay++;
  visitorsThisDay++;

  gameA.decide(shouldAccept);
}
dayAudit.push({ day: currentDayTracked, rules: currentDayRuleCount, problematic: problematicSeenThisDay, visitors: visitorsThisDay });

console.log("\nResultado final:", gameA.isWon() ? "VICTORIA" : "DERROTA", "| dinero:", gameA.money, "| errores:", gameA.errors);

console.log("\n--- Muestra de 10 visitantes generados ---");
visitorLog.slice(0, 10).forEach(v => console.log(JSON.stringify(v)));

console.log("\n--- Auditoria de reglas activas y problematicos por dia ---");
dayAudit.forEach((d, i) => {
  const rulesExpected = expectedRuleCounts[i];
  const probExpected = expectedProblematicCounts[i];
  const rulesOk = d.rules === rulesExpected ? "OK" : `FALLO (esperado ${rulesExpected})`;
  const probOk = d.problematic === probExpected ? "OK" : `FALLO (esperado ${probExpected})`;
  console.log(`Dia ${d.day}: reglas activas=${d.rules} [${rulesOk}] | problematicos=${d.problematic}/${d.visitors} [${probOk}]`);
});

console.log("\n--- Chequeo: todo visitante con region 'rio' nunca tiene cuernos ni ojos amarillos ---");
const badKappa = visitorLog.filter(v => v.region === "rio" && (v.horns || v.yellowEyes));
console.log(badKappa.length === 0 ? "OK: ninguna inconsistencia" : `FALLO: ${badKappa.length} casos inconsistentes -> ${JSON.stringify(badKappa)}`);

// ================= TEST 2: partida "siempre falla" (hasta derrota) =================
console.log("\n========== TEST 2: partida con errores forzados, hasta derrota ==========");
const gameB = new Game();
await loadDataAsync(gameB);
gameB.startNewGame();
let decisionesB = 0;
while (!gameB.isWon() && !gameB.isLost()) {
  const violation = gameB.currentDay.evaluateCharacter(gameB.currentVisitor);
  const shouldAccept = violation === null;
  gameB.decide(!shouldAccept); // siempre la respuesta incorrecta a proposito
  decisionesB++;
}
console.log("Resultado final:", gameB.isWon() ? "VICTORIA (inesperado)" : "DERROTA", "| errores:", gameB.errors, "(esperado 5)", "| decisiones tomadas:", decisionesB, "(esperado 5)");

// ================= TEST 3: guardar y cargar progreso a mitad de partida =================
console.log("\n========== TEST 3: guardar progreso al terminar el dia 1, y cargarlo en una partida nueva ==========");
resetMocks();
const gameC = new Game();
await loadDataAsync(gameC);
gameC.startNewGame();
for (let i = 0; i < 6; i++) {
  const violation = gameC.currentDay.evaluateCharacter(gameC.currentVisitor);
  gameC.decide(violation === null);
}
console.log("gameC despues de terminar el dia 1 -> dia:", gameC.dayNumber, "| dinero:", gameC.money, "| errores:", gameC.errors);

const gameD = new Game();
await loadDataAsync(gameD);
const cargoBien = gameD.loadProgress();
console.log("gameD.loadProgress() devolvio:", cargoBien, "(esperado true)");
console.log("gameD tras cargar -> dia:", gameD.dayNumber, "| dinero:", gameD.money, "| errores:", gameD.errors);
console.log("coincide con gameC:", (gameD.dayNumber === gameC.dayNumber && gameD.money === gameC.money && gameD.errors === gameC.errors) ? "OK" : "FALLO");

// ================= TEST 4: historial respeta el limite de 3 =================
console.log("\n========== TEST 4: historial guarda maximo 3 resultados ==========");
resetMocks();
for (let partida = 1; partida <= 4; partida++) {
  const g = new Game();
  await loadDataAsync(g);
  g.startNewGame();
  while (!g.isWon() && !g.isLost()) {
    const violation = g.currentDay.evaluateCharacter(g.currentVisitor);
    const shouldAccept = violation === null;
    g.decide(!shouldAccept); // fuerza siempre la respuesta incorrecta, para llegar rapido a derrota
  }
}
const historial = getHistory();
console.log("cantidad de partidas jugadas: 4 | entradas en historial:", historial.length, "(esperado 3)");
console.log(JSON.stringify(historial, null, 2));

// ================= TEST 5: mezcla de aciertos y errores dentro de un mismo dia =================
console.log("\n========== TEST 5: mezcla de aciertos y errores, verificar dinero/errores/avance de dia ==========");
resetMocks();
const gameE = new Game();
await loadDataAsync(gameE);
gameE.startNewGame();
const patronE = [true, false, true, true, false, true]; // true = responder correcto, false = responder incorrecto
let dineroEsperadoE = 10;
let erroresEsperadosE = 0;
patronE.forEach((responderCorrecto, i) => {
  const violation = gameE.currentDay.evaluateCharacter(gameE.currentVisitor);
  const shouldAccept = violation === null;
  gameE.decide(responderCorrecto ? shouldAccept : !shouldAccept);
  if (responderCorrecto) { dineroEsperadoE += 10; } else { dineroEsperadoE -= 5; erroresEsperadosE += 1; }
});
console.log("dinero real:", gameE.money, "| dinero esperado:", dineroEsperadoE, gameE.money === dineroEsperadoE ? "[OK]" : "[FALLO]");
console.log("errores reales:", gameE.errors, "| errores esperados:", erroresEsperadosE, gameE.errors === erroresEsperadosE ? "[OK]" : "[FALLO]");
console.log("dia tras 6 visitantes (con mezcla de aciertos/errores):", gameE.dayNumber, gameE.dayNumber === 2 ? "[OK]" : "[FALLO]");

// ================= TEST 6: derrota justo en el ultimo visitante del dia (caso limite) =================
console.log("\n========== TEST 6: el 5to error coincide con el 6to visitante del dia ==========");
resetMocks();
const gameF = new Game();
await loadDataAsync(gameF);
gameF.startNewGame();
// visitantes 1-4 del dia 1: responder mal (4 errores). visitante 5: responder bien. visitante 6: responder mal (5to error, y ultimo del dia)
const patronF = [false, false, false, false, true, false];
patronF.forEach((responderCorrecto) => {
  if (gameF.isLost() || gameF.isWon()) return;
  const violation = gameF.currentDay.evaluateCharacter(gameF.currentVisitor);
  const shouldAccept = violation === null;
  gameF.decide(responderCorrecto ? shouldAccept : !shouldAccept);
});
console.log("errores:", gameF.errors, "(esperado 5)", "| isLost():", gameF.isLost(), "(esperado true)");
console.log("dia quedo en:", gameF.dayNumber, "(esperado 1, NO deberia haber avanzado a dia 2)");
const historialF = getHistory();
console.log("entrada guardada en historial:", JSON.stringify(historialF[0]));
console.log("resultado 'derrota' con day:1:", (historialF[0].result === "derrota" && historialF[0].day === 1) ? "[OK]" : "[FALLO]");

// ================= TEST 7: specieLiar() coincide con el calculo manual, en volumen =================
console.log("\n========== TEST 7: specieLiar() consistente en volumen (partida completa) ==========");
resetMocks();
const gameG = new Game();
await loadDataAsync(gameG);
gameG.startNewGame();
let inconsistenciasLiar = 0;
let totalRevisados = 0;
while (!gameG.isWon() && !gameG.isLost()) {
  const visitor = gameG.currentVisitor;
  const p = visitor.obtainPassport;
  const esperado = p.obtainDeclaredSpecie === "humano" && (visitor.obtainHaveHorns || visitor.obtainYellowEyes || p.obtainRegion === "rio");
  const real = visitor.specieLiar();
  totalRevisados++;
  if (esperado !== real) {
    inconsistenciasLiar++;
    console.log("INCONSISTENCIA:", JSON.stringify(describeVisitor(visitor)), "esperado:", esperado, "real:", real);
  }
  const violation = gameG.currentDay.evaluateCharacter(visitor);
  gameG.decide(violation === null);
}
console.log("visitantes revisados:", totalRevisados, "| inconsistencias:", inconsistenciasLiar, inconsistenciasLiar === 0 ? "[OK]" : "[FALLO]");

// ================= TEST 8: integridad de historial y partida actual tras terminar el juego =================
console.log("\n========== TEST 8: historial refleja el resultado real, y no queda partida 'en curso' tras terminar ==========");
resetMocks();
const { loadCurrentGame } = await import("./public/js/Storage.js");
const gameH = new Game();
await loadDataAsync(gameH);
gameH.startNewGame();
while (!gameH.isWon() && !gameH.isLost()) {
  const violation = gameH.currentDay.evaluateCharacter(gameH.currentVisitor);
  gameH.decide(!(violation === null)); // fuerza derrota
}
const historialH = getHistory();
const ultima = historialH[0];
console.log("ultima entrada del historial:", JSON.stringify(ultima));
const coincideValores = ultima.errors === gameH.errors && ultima.money === gameH.money && ultima.result === "derrota";
console.log("valores del historial coinciden con el estado final del juego:", coincideValores ? "[OK]" : "[FALLO]");
const partidaActualTrasTerminar = loadCurrentGame();
console.log("loadCurrentGame() despues de terminar:", partidaActualTrasTerminar, partidaActualTrasTerminar === null ? "[OK: no se puede continuar una partida terminada]" : "[FALLO: quedo una partida guardada]");
