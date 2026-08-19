// ARCHIVO TEMPORAL DE PRUEBA - se borra al terminar de testear, no es parte del proyecto entregable.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

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

const { Game } = await import("../public/js/classes/Game.js");
const { getHistory } = await import("../public/js/Storage.js");

// jugar perfecto ya no es solo aceptar/rechazar bien: desde el dia en que rige la
// regla del sello azul (ver reglas.json, "selloAlien"), a un alien limpio hay que
// aprobarlo con el AZUL. Esto devuelve la decision correcta completa.
function decidirBien(game) {
  const visitor = game.currentVisitor;
  const violation = game.currentDay.evaluateCharacter(visitor);
  const shouldAccept = violation === null;
  const usedAlienStamp = shouldAccept && game.alienStampRuleActive() && visitor.isAlien();
  game.decide(shouldAccept, usedAlienStamp);
  return shouldAccept;
}

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
    stamp: p.obtainStamp
  };
}

// el dia ya no tiene una cantidad fija de visitantes (dura por tiempo, no por
// conteo - ver Game#endDay()), asi que estos tests simulan "un dia" decidiendo
// una cantidad grande de visitantes y llamando endDay() a mano, igual que
// hace main.ts cuando se acaba el temporizador del dia.
const VISITORS_PER_SIMULATED_DAY = 150;

// dia 4 en adelante suma 4 reglas de una vez (especieProhibida: kitsune/oni/kappa/
// poseido, ver reglas.json) en vez de 1 sola, por eso el salto de 3 a 7.
// Ninguna regla se apaga nunca (ver dias.json) - dia 6 no suma ninguna nueva (se
// queda en 8, igual que el 5) y el dia 7 suma la del sello plateado (9).
const expectedRuleCounts = [1, 2, 3, 7, 8, 9, 10]; // dias 6 y 7 suman la regla del sello azul de los alien
// antes eran cantidades exactas (el sorteo pre-armaba un array de tamaño fijo);
// ahora cada visitante se sortea con esta probabilidad de forma independiente
// (ver Game#generateVisitor()), asi que solo se puede pedir que la PROPORCION
// observada, sobre una muestra grande, ande cerca del valor esperado.
const expectedProblematicRatios = [2 / 6, 3 / 6, 4 / 6, 5 / 6, 5 / 6, 7 / 8, 7 / 8];
const RATIO_TOLERANCE = 0.12;

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

for (let dia = 1; dia <= 7 && !gameA.isLost(); dia++) {
  const day = gameA.currentDay;
  let problematicosHoy = 0;
  for (let i = 0; i < VISITORS_PER_SIMULATED_DAY && !gameA.isLost(); i++) {
    const visitor = gameA.currentVisitor;
    const violation = day.evaluateCharacter(visitor);
    const shouldAccept = violation === null;
    visitorLog.push({ day: dia, ...describeVisitor(visitor), rejected: !shouldAccept });
    if (!shouldAccept) problematicosHoy++;
    const usedAlienStamp = shouldAccept && gameA.alienStampRuleActive() && visitor.isAlien();
    gameA.decide(shouldAccept, usedAlienStamp);
  }
  dayAudit.push({ day: dia, rules: day.getActiveRules().length, problematic: problematicosHoy, visitors: VISITORS_PER_SIMULATED_DAY });
  if (!gameA.isLost()) {
    gameA.endDay();
  }
}

console.log("\nResultado final:", gameA.isWon() ? "VICTORIA" : "DERROTA", "| dinero:", gameA.money, "| errores:", gameA.errors);

console.log("\n--- Muestra de 10 visitantes generados ---");
visitorLog.slice(0, 10).forEach(v => console.log(JSON.stringify(v)));

console.log("\n--- Auditoria de reglas activas y proporcion de problematicos por dia (sobre", VISITORS_PER_SIMULATED_DAY, "visitantes simulados) ---");
dayAudit.forEach((d, i) => {
  const rulesExpected = expectedRuleCounts[i];
  const ratioExpected = expectedProblematicRatios[i];
  const ratioObservada = d.problematic / d.visitors;
  const rulesOk = d.rules === rulesExpected ? "OK" : `FALLO (esperado ${rulesExpected})`;
  const ratioOk = Math.abs(ratioObservada - ratioExpected) <= RATIO_TOLERANCE ? "OK" : `FALLO (esperado ~${ratioExpected.toFixed(2)})`;
  console.log(`Dia ${d.day}: reglas activas=${d.rules} [${rulesOk}] | problematicos=${d.problematic}/${d.visitors} (${ratioObservada.toFixed(2)}) [${ratioOk}]`);
});

// nota: desde que existen "rasgos combinados" (Game#generateVisitor), un visitante puede
// tener cuernos/ojos amarillos Y ademas region "rio" a la vez (ej: un Oni que tambien viene
// del rio) - eso ya no es una inconsistencia. Lo que SI se sigue garantizando (constructor
// de Yokai, sin tocar) es que cuernos y ojos amarillos nunca coexisten en el mismo visitante.
console.log("\n--- Chequeo: ningun visitante tiene cuernos Y ojos amarillos a la vez ---");
const cuernosYOjos = visitorLog.filter(v => v.horns && v.yellowEyes);
console.log(cuernosYOjos.length === 0 ? "OK: ninguna inconsistencia" : `FALLO: ${cuernosYOjos.length} casos inconsistentes -> ${JSON.stringify(cuernosYOjos)}`);

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
console.log("Resultado final:", gameB.isWon() ? "VICTORIA (inesperado)" : "DERROTA", "| errores:", gameB.errors, "(esperado 4)", "| decisiones tomadas:", decisionesB, "(esperado 4)");

// ================= TEST 3: guardar y cargar progreso a mitad de partida =================
console.log("\n========== TEST 3: guardar progreso al terminar el dia 1 (via endDay()), y cargarlo en una partida nueva ==========");
resetMocks();
const gameC = new Game();
await loadDataAsync(gameC);
gameC.startNewGame();
for (let i = 0; i < 5; i++) {
  decidirBien(gameC);
}
gameC.endDay(); // simula que se acabo el temporizador del dia 1
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

// ================= TEST 5: mezcla de aciertos y errores (dinero/errores), y que endDay() sea lo unico que avanza el dia =================
console.log("\n========== TEST 5: mezcla de aciertos y errores (dinero/errores), y que endDay() sea lo unico que avanza el dia ==========");
resetMocks();
const gameE = new Game();
await loadDataAsync(gameE);
gameE.startNewGame();
const patronE = [true, false, true, true, false, true]; // true = responder correcto, false = responder incorrecto
let dineroEsperadoE = 10;
let erroresEsperadosE = 0;
patronE.forEach((responderCorrecto) => {
  const violation = gameE.currentDay.evaluateCharacter(gameE.currentVisitor);
  const shouldAccept = violation === null;
  gameE.decide(responderCorrecto ? shouldAccept : !shouldAccept);
  if (responderCorrecto) { dineroEsperadoE += 2; } else { dineroEsperadoE -= 5; erroresEsperadosE += 1; }
});
console.log("dinero real:", gameE.money, "| dinero esperado:", dineroEsperadoE, gameE.money === dineroEsperadoE ? "[OK]" : "[FALLO]");
console.log("errores reales:", gameE.errors, "| errores esperados:", erroresEsperadosE, gameE.errors === erroresEsperadosE ? "[OK]" : "[FALLO]");
console.log("dia tras 6 visitantes, ANTES de endDay():", gameE.dayNumber, gameE.dayNumber === 1 ? "[OK: decide() ya no avanza de dia por si solo]" : "[FALLO]");
gameE.endDay();
console.log("dia DESPUES de endDay():", gameE.dayNumber, gameE.dayNumber === 2 ? "[OK]" : "[FALLO]");

// ================= TEST 6: el 4to error corta la partida al toque =================
console.log("\n========== TEST 6: el 4to error corta la partida al toque, sin esperar a que termine el dia ==========");
resetMocks();
const gameF = new Game();
await loadDataAsync(gameF);
gameF.startNewGame();
// visitantes 1-3: responder mal (3 errores). visitantes 4 y 5: responder bien. visitante 6: responder mal (4to error)
const patronF = [false, false, false, true, true, false];
patronF.forEach((responderCorrecto) => {
  if (gameF.isLost() || gameF.isWon()) return;
  const violation = gameF.currentDay.evaluateCharacter(gameF.currentVisitor);
  const shouldAccept = violation === null;
  gameF.decide(responderCorrecto ? shouldAccept : !shouldAccept);
});
console.log("errores:", gameF.errors, "(esperado 4)", "| isLost():", gameF.isLost(), "(esperado true)");
console.log("dia quedo en:", gameF.dayNumber, "(esperado 1 - decide() ya no toca dayNumber en absoluto)");
const historialF = getHistory();
console.log("entrada guardada en historial:", JSON.stringify(historialF[0]));
console.log("resultado 'derrota' con day:1:", (historialF[0].result === "derrota" && historialF[0].day === 1) ? "[OK]" : "[FALLO]");

// ================= TEST 7: lista negra de especies (especieProhibida) consistente en volumen =================
// reemplaza al viejo test de specieLiar() (esa regla/metodo se elimino - quedaba
// redundante con la lista negra desde que ninguna regla se apaga nunca, ver diario).
console.log("\n========== TEST 7: especieProhibida consistente en volumen (partida completa) ==========");
resetMocks();
const gameG = new Game();
await loadDataAsync(gameG);
gameG.startNewGame();
const bannedSpecies = ["kitsune", "oni", "kappa", "poseido"];
let inconsistenciasLista = 0;
let totalRevisados = 0;
for (let dia = 1; dia <= 7 && !gameG.isLost(); dia++) {
  const reglaActiva = gameG.currentDay.getActiveRules().some(r => r.getProperty() === "especieProhibida");
  for (let i = 0; i < VISITORS_PER_SIMULATED_DAY && !gameG.isLost(); i++) {
    const visitor = gameG.currentVisitor;
    const p = visitor.obtainPassport;
    const violation = gameG.currentDay.evaluateCharacter(visitor);
    const declaroProhibida = bannedSpecies.includes(p.obtainDeclaredSpecie);
    // si declaro una especie de la lista negra Y la regla ya esta activa hoy, tiene
    // que estar rechazado (por esta regla u otra) - nunca puede pasar "de colado".
    totalRevisados++;
    if (declaroProhibida && reglaActiva && violation === null) {
      inconsistenciasLista++;
      console.log("INCONSISTENCIA:", JSON.stringify(describeVisitor(visitor)));
    }
    const usedAlienStampG = violation === null && gameG.alienStampRuleActive() && visitor.isAlien();
    gameG.decide(violation === null, usedAlienStampG);
  }
  if (!gameG.isLost()) {
    gameG.endDay();
  }
}
console.log("visitantes revisados:", totalRevisados, "| inconsistencias:", inconsistenciasLista, inconsistenciasLista === 0 ? "[OK]" : "[FALLO]");

// ================= TEST 8: integridad de historial y partida actual tras terminar el juego =================
console.log("\n========== TEST 8: historial refleja el resultado real, y no queda partida 'en curso' tras terminar ==========");
resetMocks();
const { loadCurrentGame } = await import("../public/js/Storage.js");
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

// ================= TEST 9: regla del sello azul de los alien (dia 6) =================
console.log("\n========== TEST 9: sello azul de los alien - solo desde el dia 6, y solo para ellos ==========");
resetMocks();

// avanza una partida hasta el dia pedido sin cometer errores
async function partidaEnDia(dia) {
  const g = new Game();
  await loadDataAsync(g);
  g.startNewGame();
  while (g.dayNumber < dia) {
    decidirBien(g);
    g.endDay();
  }
  return g;
}

// busca un visitante que cumpla la condicion pedida, decidiendo bien mientras tanto
function buscarVisitante(game, condicion) {
  for (let i = 0; i < 400; i++) {
    const visitor = game.currentVisitor;
    const violation = game.currentDay.evaluateCharacter(visitor);
    if (condicion(visitor, violation)) {
      return visitor;
    }
    decidirBien(game);
  }
  return null;
}

const esAlienLimpio = (visitor, violation) => visitor.isAlien() && violation === null;
const noAlienLimpio = (visitor, violation) => !visitor.isAlien() && violation === null;

const gameDia5 = await partidaEnDia(5);
console.log("dia 5 -> alienStampRuleActive():", gameDia5.alienStampRuleActive(), gameDia5.alienStampRuleActive() === false ? "[OK: todavia no rige]" : "[FALLO]");
const alienDia5 = buscarVisitante(gameDia5, esAlienLimpio);
if (alienDia5 === null) {
  console.log("[AVISO] no salio ningun alien limpio en el dia 5, se saltea este chequeo");
} else {
  const erroresAntes = gameDia5.errors;
  gameDia5.decide(true); // verde, sin sello azul
  console.log("dia 5, alien limpio aprobado con VERDE -> errores +", gameDia5.errors - erroresAntes, gameDia5.errors === erroresAntes ? "[OK: antes del dia 6 el verde es lo correcto]" : "[FALLO]");
}

const gameDia6 = await partidaEnDia(6);
console.log("dia 6 -> alienStampRuleActive():", gameDia6.alienStampRuleActive(), gameDia6.alienStampRuleActive() === true ? "[OK: ya rige]" : "[FALLO]");

const alienVerde = buscarVisitante(gameDia6, esAlienLimpio);
if (alienVerde === null) {
  console.log("[AVISO] no salio ningun alien limpio, se saltea el chequeo del verde");
} else {
  const antes = gameDia6.errors;
  gameDia6.decide(true, false); // verde sobre un alien: mal
  console.log("dia 6, alien limpio aprobado con VERDE -> errores +", gameDia6.errors - antes, gameDia6.errors === antes + 1 ? "[OK: cuenta como error]" : "[FALLO]");
}

const gameDia6b = await partidaEnDia(6);
const alienAzul = buscarVisitante(gameDia6b, esAlienLimpio);
if (alienAzul === null) {
  console.log("[AVISO] no salio ningun alien limpio, se saltea el chequeo del azul");
} else {
  const antes = gameDia6b.errors;
  gameDia6b.decide(true, true); // azul sobre un alien: bien
  console.log("dia 6, alien limpio aprobado con AZUL -> errores +", gameDia6b.errors - antes, gameDia6b.errors === antes ? "[OK: es la decision correcta]" : "[FALLO]");
}

const gameDia6c = await partidaEnDia(6);
const humanoAzul = buscarVisitante(gameDia6c, noAlienLimpio);
if (humanoAzul === null) {
  console.log("[AVISO] no salio ningun visitante limpio no-alien, se saltea el chequeo");
} else {
  const antes = gameDia6c.errors;
  gameDia6c.decide(true, true); // azul sobre alguien que no es alien: mal
  console.log("dia 6, visitante limpio NO alien aprobado con AZUL -> errores +", gameDia6c.errors - antes, gameDia6c.errors === antes + 1 ? "[OK: el azul es solo para alien]" : "[FALLO]");
}

// el pasaporte de un alien siempre declara lo mismo, sin importar el dia
const gameAlienPasaporte = await partidaEnDia(6);
let alienesRevisados = 0;
let pasaportesRaros = 0;
for (let i = 0; i < 300; i++) {
  const visitor = gameAlienPasaporte.currentVisitor;
  if (visitor.isAlien()) {
    alienesRevisados++;
    const p = visitor.obtainPassport;
    if (p.obtainRegion !== "via lactea" || p.obtainDeclaredSpecie !== "alien") {
      pasaportesRaros++;
      console.log("PASAPORTE DE ALIEN INCONSISTENTE:", JSON.stringify(describeVisitor(visitor)));
    }
  }
  decidirBien(gameAlienPasaporte);
}
console.log("aliens revisados:", alienesRevisados, "| pasaportes fuera de regla:", pasaportesRaros, pasaportesRaros === 0 && alienesRevisados > 0 ? "[OK: siempre 'via lactea' + 'alien']" : "[FALLO]");

// ================= TEST 10: datos de los premios de fin de partida =================
console.log("\n========== TEST 10: datos de los premios (dias completados, mejor dia, quien se te paso) ==========");
resetMocks();
const gameI = new Game();
await loadDataAsync(gameI);
gameI.startNewGame();

const VISITANTES_DIA_1 = 20;
for (let i = 0; i < VISITANTES_DIA_1; i++) {
  decidirBien(gameI);
}
gameI.endDay(); // cierra el dia 1
for (let i = 0; i < 5; i++) {
  decidirBien(gameI);
}
gameI.endDay(); // cierra el dia 2

console.log("dias completados:", gameI.daysCompleted, gameI.daysCompleted === 2 ? "[OK]" : "[FALLO: esperado 2]");
console.log("mejor dia:", gameI.bestDayNumber, "con", gameI.bestDayVisitors, "visitantes",
  gameI.bestDayNumber === 1 && gameI.bestDayVisitors === VISITANTES_DIA_1 ? "[OK]" : `[FALLO: esperado dia 1 con ${VISITANTES_DIA_1}]`);
console.log("jugando perfecto no se le paso ningun Oni/Kitsune/Kappa:",
  !gameI.letThroughOni && !gameI.letThroughKitsune && !gameI.letThroughKappa ? "[OK]" : "[FALLO]");

// dejar pasar a un cuernudo a proposito tiene que quedar registrado
const gameJ = new Game();
await loadDataAsync(gameJ);
gameJ.startNewGame();
const cuernudo = buscarVisitante(gameJ, (visitor) => visitor.obtainHaveHorns);
if (cuernudo === null) {
  console.log("[AVISO] no salio ningun visitante con cuernos, se saltea el chequeo");
} else {
  gameJ.decide(true); // lo deja pasar
  console.log("tras aceptar un cuernudo -> letThroughOni:", gameJ.letThroughOni, gameJ.letThroughOni === true ? "[OK]" : "[FALLO]");
}
