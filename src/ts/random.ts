// --- generador pseudoaleatorio con semilla (mulberry32) ---
//
// Math.random() no acepta semilla: cada carga de la pagina arranca otra
// secuencia, asi que dos personas nunca ven los mismos visitantes. El
// "desafio diario" necesita justo lo contrario: que a partir de un mismo
// numero (derivado de la fecha) todos obtengan EXACTAMENTE la misma secuencia,
// en el mismo orden. mulberry32 hace eso con un estado de 32 bits y devuelve
// una funcion con la misma forma que Math.random (un numero en el rango [0, 1)).

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function (): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// semilla del desafio del dia: la fecha local como numero YYYYMMDD (por
// ejemplo 20260830). Es la misma para todos los que jueguen el mismo dia
// del calendario, sin importar la hora ni la zona horaria mas alla del dia.
export function todayChallengeSeed(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}
