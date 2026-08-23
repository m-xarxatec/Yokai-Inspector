# Especificaciones: Sistema Económico — Yokai Inspector

## 1. Resumen
Yokai Inspector ya tiene un sistema económico básico implementado en `Game.ts`: el dinero sube al acertar una decisión y baja al fallarla, se acumula como ranking histórico entre partidas, y dispara un final alternativo si se llega a un umbral alto. Este documento describe lo que existe hoy y propone cómo completarlo (uso real del dinero dentro de la partida, cobro diario, errores de procedimiento distintos de la decisión).

## 2. Estado actual del repositorio
Sí existe un sistema de dinero, no hay que crearlo desde cero:

- `Game.ts:14` — campo `#money: number`, arranca en `10` (`Game.ts:51`).
- `Game.ts:368-378`, dentro de `decide(accept, usedAlienStamp)`: si la decisión fue correcta (`wasCorrect`), `+2` (`Game.ts:371`); si fue incorrecta, `-5` y además suma 1 a `#errors` (`Game.ts:374-377`). El comentario en `Game.ts:371` deja registro de que antes era +10 y se bajó a +2 al pasar el día de "cantidad fija de visitantes" a "duración por tiempo".
- No hay ningún cobro fijo por día (renta/salario) en ningún archivo — se buscó "renta", "alquiler", "salario", "cobro" en `src/ts` y no aparece nada.
- No hay penalización de dinero por "errores de procedimiento" distintos de la decisión en sí (p. ej. dejar pasar a un Oni no resta dinero aparte del -5 ya contado como error de decisión; `#recordLetThrough()` en `Game.ts:333-343` solo lo anota para los finales/premios, sin efecto económico).
- El dinero se persiste en la partida en curso y en el historial (`saveCurrentGame`/`saveToHistory` en `Storage.ts`, campo `money`), y también como ranking acumulado entre partidas vía `addCredits(playerName, money)` (`Storage.ts:48-53`, clave `yokaiInspector_credits`), mostrado en la pantalla de Créditos (`main.ts:364-372`, `getAllCredits()`).
- Único uso actual del dinero fuera de mostrarlo en el HUD (`main.ts:1040`, `#money-counter`): dispara el final "jefa millonaria" si `game.money >= RICH_BOSS_MONEY` (`main.ts:1556`, `RICH_BOSS_MONEY = 300`, comparado en `main.ts:1650`).
- Dificultad progresiva: no existe una variable `bossLevel`. La dificultad real es la cantidad de reglas activas acumuladas por día en `public/data/dias.json` (día 1 → 1 regla, día 7 → 7 reglas) y `#maxErrors = 4` (`Game.ts:52`), que decide la derrota (`isLost()`, `Game.ts:422-424`).

## 3. Usos del dinero en el juego
Ordenado por prioridad de implementación:

1. **Ranking entre partidas (ya implementado)** — créditos acumulados por nombre de jugador, pantalla de Créditos.
2. **Condición de final alternativo (ya implementado)** — `RICH_BOSS_MONEY` para el final "jefa millonaria".
3. **Revisar pasaporte (pista) — ya implementado** — costo `3` (`Game.ts#buyHint()`/`hintCost`). Revela la propiedad de la regla que el visitante actual viola (resaltado visual en `main.ts`, 2.5s); si está limpio no resalta nada pero el costo se cobra igual — el riesgo de comprarla "a ciegas". Un uso por visitante (hay que comprarla de nuevo para el siguiente).
4. **Tiempo extra en el reloj de arena — ya implementado** — costo `5` (`Game.ts#buyExtraTime()`/`extraTimeCost`), suma `EXTRA_TIME_MS` (15 segundos, constante en `main.ts`) al día actual. Límite de 1 vez por día (`usedExtraTimeToday`, se resetea en `#startDay()`), para no quitarle presión al reloj.
5. **"Indulto" (seguro contra un error)** (propuesta, todavía no implementada) — costo `8` (la más cara). El próximo error no cuenta para los 4 que pierden la partida (`#errors` no sube), aunque igual resta el -5 de esa decisión. Un indulto activo a la vez; si no se usa en el día, se pierde al terminar.

Las tres compras se accionan desde el botón `$` nuevo del HUD (junto al de pausa, `#shop-btn`), que abre la pantalla `#shop-screen` — decisión de la sección 8.

## 4. Tabla de valores económicos

| Evento | Efecto económico | Cuándo se aplica | Dónde se dispara en el código |
|---|---|---|---|
| Decisión correcta (aceptar sin regla violada con el sello correcto, o rechazar cuando correspondía) | +2 dinero | En cada `decide()`, ya implementado | `Game.ts:371` (`#money`), `Game.ts:372` (`#dayMoney`) |
| Decisión incorrecta | -5 dinero (y +1 a `#errors`) | En cada `decide()`, ya implementado | `Game.ts:374-377` |
| Error de procedimiento: decidir sin revisar el pasaporte | **Ya implementado**: -1 dinero adicional (`RUSH_PENALTY`), sin sumar a `#errors` | Cuando pasan menos de `RUSH_THRESHOLD_MS` (700ms) entre que se habilita decidir (se abre el pasaporte) y el jugador suelta el sello | `Game.ts#decide()`, parámetro `wasRushed`; medido en `main.ts#resolveDecision()`; mostrado en `#day-summary-screen` vía `game.lastDayRushPenalty` |
| Cobro diario (renta/gastos fijos) | **Ya implementado**: `2 + reglasActivas` del día que arranca (4/5/9/10/11/12 según el día, día 1 no cobra); puede dejar `#money` en negativo, no termina la partida por sí sola (ver sección 6) | Una vez por día, dentro de `endDay()`, al pasar al día siguiente (nunca en `loadProgress()`, para no cobrar de nuevo al recargar la página) | `Game.ts#chargeDailyCost()`, llamado desde `endDay()`; mostrado en `#day-summary-screen` vía `game.lastDayCharge` (`main.ts`) |

**Nota sobre el cambio de idea en "error de procedimiento"**: las dos ideas originales de esta fila (dejar pasar un visitante peligroso sin regla activa todavía, o exceder el tiempo sin decidir) se descartaron al revisar el código real antes de implementar. La primera no puede pasar nunca — `Game.ts#generateVisitor()` solo genera cuernos/ojos amarillos cuando la regla correspondiente ya está activa, así que un visitante peligroso siempre viola alguna regla y ya cae en el -5 normal de `decide()`. La segunda penalizaría a todo el mundo por igual al final de cada día, porque siempre queda un visitante nuevo sin decidir cuando se acaba el reloj (se genera uno apenas se decide el anterior) — no es algo que el jugador pueda evitar, así que no es un "error" de nadie. Se reemplazaron por "decidir sin revisar el pasaporte" (arriba), que sí depende de una acción real del jugador.

## 5. Escalado con la dificultad
No hay `bossLevel`; la progresión real es la cantidad de reglas activas de `Day.getActiveRules()` (no es lo mismo que el array `reglasActivas` de `dias.json`: `especieProhibida` expande a 4 reglas separadas —kitsune/oni/kappa/poseído— desde el día 4, así que el conteo real salta de 3 a 7 ese día, no de 3 a 4) y el `objetivoVisitantes` (6 en días 1-5, 8 en días 6-7).

- La ganancia por acierto (+2) y la pérdida por error (-5) se mantienen fijas — cambiarlas por día complicaría leer el HUD sin necesidad.
- El cobro diario **(ya implementado, ver `Game.ts#chargeDailyCost()`)** escala con `getActiveRules().length`: `costoDiario = 2 + reglasActivas.length`. Con el conteo real (1, 2, 3, 7, 8, 9, 10 reglas de los días 1 a 7), el cobro queda en 4, 5, 9, 10, 11 y 12 para los días 2 a 7 (51 en total en una partida completa) — más alto que la estimación original de ~39 que se había hecho leyendo solo `dias.json` sin revisar cómo `especieProhibida` se expande en `reglas.json`.
- `RICH_BOSS_MONEY = 300` se mantiene sin cambios por ahora (decisión en sección 8): el cobro real (51 en total) es más alto que el estimado original pero sigue siendo una fracción chica frente a lo que deja una partida jugada rápido y limpio. Confirmado en el test 11 de `docs/test-temporal.mjs` (dinero puede quedar negativo, sin que eso afecte `isLost()`). Igual es un valor a confirmar con playtesting jugando de verdad, no solo con los tests automáticos.

## 6. Casos límite y reglas de negocio
- **Dinero negativo — decisión tomada:** `#money` puede quedar en negativo (ya pasa hoy: el set de pruebas registra una derrota con `money: -6` y nada se rompe) y **eso no es motivo de derrota por sí solo**. La única condición de derrota sigue siendo `#errors >= #maxErrors` (`isLost()`). El dinero simplemente sube si ganás y baja si perdés — un jugador sin dinero suficiente para el cobro diario sigue jugando en negativo, no pierde la partida por eso. `addCredits()` sigue sumando el valor tal cual (positivo o negativo) al ranking histórico, sin cambios.
- **Cobro diario aunque no se haya decidido nada ese día:** se aplica siempre al inicio de `#startDay()`, incluso si el jugador pierde por tiempo antes de ver a un solo visitante ese día — es consistente con que el cobro sea "el costo de vivir ese día", no algo ligado a las decisiones tomadas.
- **Redondeos:** todos los valores actuales y propuestos son enteros; no hay decimales en ningún lado del sistema, no hace falta redondear.
- **Compatibilidad con partidas guardadas:** igual que se hizo con `totalDays` (`Game.ts:494`, `saved.totalDays ?? 7`), cualquier campo nuevo (ej. contador de "seguros" comprados) necesitaría un valor de respaldo `?? 0` al cargar `loadCurrentGame()` para no romper partidas guardadas antes del cambio.

## 7. Integración con el código existente
- Todo lo relacionado a `#money`, `#dayMoney`, cobro diario y nuevas penalizaciones es lógica de juego → **Grupo B (Iralys)**, va en `Game.ts` (estado y reglas de negocio) y `main.ts` (mostrarlo en el HUD, sonidos si aplica).
- No tocar `Passport.ts`/`Character.ts`/`Human.ts`/`Yokai.ts` (Grupo A) salvo que una pista o seguro necesite leer un rasgo del visitante actual — en ese caso, usar los getters que ya exponen esas clases, no agregarles campos nuevos.
- Restricciones del curso a respetar: sin `interface`, sin tipos unión/genéricos (salvo `X | null`), sin `try/catch`, sin `async/await`, sin `Map`/`Set`, sin `switch` (salvo `Rule.isViolated()`), campos privados con `#`, comentarios en español, imports relativos con `.js`.
- Cualquier campo nuevo en el estado de `Game` debe agregarse también a `saveCurrentGame()`/`loadCurrentGame()` y a `saveToHistory()` en `Storage.ts` si tiene que sobrevivir a un refresco de página o aparecer en el historial, siguiendo el mismo patrón que `money`/`totalDays`.

## 8. Decisiones tomadas / preguntas cerradas en esta revisión
- **Cobro diario y dinero en negativo:** resuelto e **implementado** — el cobro diario resta como cualquier evento económico, puede dejar `#money` negativo, y eso NO es una condición de derrota nueva. Se gana dinero si se gana la partida, se pierde si se pierde; no hay un "game over por no poder pagar". Cubierto por el test 11 de `docs/test-temporal.mjs`.
- **Ubicación en la UI de pistas/seguro (compras 3-5 de la sección 3):** botón nuevo en el HUD junto al de pausa, que abre un panel simple tipo "Tienda" con las opciones de compra, deshabilitado si no alcanza el dinero. No va en Opciones (esa pantalla es configuración global, no acciones de una partida en curso). **Todavía no implementado.**
- **Recalibrar `RICH_BOSS_MONEY`:** se mantiene en 300 por ahora; revisar con playtesting después de implementar el cobro diario, y bajarlo a ~250 como primer ajuste si en la práctica queda inalcanzable.
- **Pantalla de resumen de día:** confirmado e **implementado** — se agregó una línea aparte para el cobro diario en `#day-summary-screen` (`game.lastDayCharge`, oculta si es 0), separada de "Dinero ganado" por decisiones.
- **Error de procedimiento:** las dos ideas originales se descartaron por no ser aplicables al código real (ver nota en sección 4). Se reemplazaron por **"decidir sin revisar el pasaporte"** (menos de 700ms entre abrir el pasaporte y decidir) — **implementado**, con su propia línea en `#day-summary-screen`.

## 9. Estado de la implementación (actualizado tras esta sesión)
- ✅ Cobro diario (`Game.ts#chargeDailyCost()`, campos `#dayCharge`/`#lastDayCharge`), enganchado en `endDay()` y mostrado en `#day-summary-screen`.
- ✅ Penalización por decidir sin revisar (`Game.ts#decide()`, parámetro `wasRushed`, `RUSH_PENALTY = 1`), medida en `main.ts#resolveDecision()` y mostrada en `#day-summary-screen`.
- ✅ Tienda: botón `#shop-btn` + pantalla `#shop-screen`. Pista y tiempo extra implementados (`Game.ts#buyHint()`/`buyExtraTime()`).
- ⬜ Pendiente: indulto (seguro contra un error).

No quedan preguntas abiertas pendientes de discutir con Mike por ahora.
