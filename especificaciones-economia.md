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
3. **Comprar pistas sobre la regla del día** (propuesta nueva) — p. ej. revelar una palabra prohibida del día 4 antes de tiempo, a cambio de dinero, para jugadores que van perdiendo por errores repetidos.
4. **Comprar tiempo extra en el reloj de arena** (propuesta nueva) — encaja con `DAY_DURATION_MS` (ya configurable desde Opciones), sumaría unos segundos al día actual por un costo fijo.
5. **"Seguro" contra un error** (propuesta nueva) — pagar para que el próximo error no reste una vida/no cuente para `#maxErrors`, pensado como mecánica de riesgo/recompensa coherente con el final de la jefa millonaria (arriesgar dinero para sobrevivir un día difícil).

Las compras 3-5 necesitan un punto de acceso en la UI durante el día — ver decisión en la sección 8 (botón nuevo en el HUD, no en Opciones).

## 4. Tabla de valores económicos

| Evento | Efecto económico | Cuándo se aplica | Dónde se dispara en el código |
|---|---|---|---|
| Decisión correcta (aceptar sin regla violada con el sello correcto, o rechazar cuando correspondía) | +2 dinero | En cada `decide()`, ya implementado | `Game.ts:371` (`#money`), `Game.ts:372` (`#dayMoney`) |
| Decisión incorrecta | -5 dinero (y +1 a `#errors`) | En cada `decide()`, ya implementado | `Game.ts:374-377` |
| Error de procedimiento (dejar pasar a un Oni/Kitsune/Kappa sin que viole una regla activa ese día, exceder el tiempo sin decidir) | Propuesta: -1 a -2 dinero adicional, sin sumar a `#errors` (no es un error de reglas, es un descuido aparte) | Al vencer el tiempo del visitante actual sin decisión, o al aceptar un visitante con rasgo "peligroso" que todavía no es regla activa | No existe hoy; encajaría como un nuevo método en `Game.ts` cerca de `decide()`, o un chequeo en el timer de `main.ts` |
| Cobro diario (renta/gastos fijos) | Propuesta: -3 dinero fijos al empezar cada día a partir del día 2 (el día 1 no cobra, es el primer sueldo); puede dejar `#money` en negativo, no termina la partida por sí solo (ver sección 6) | Al inicio de `#startDay()` en `Game.ts` | No existe hoy; encajaría en `Game.ts`, método `#startDay()` (`Game.ts:106-113`); se mostraría como línea aparte en `#day-summary-screen` |

## 5. Escalado con la dificultad
No hay `bossLevel`; la progresión real es la cantidad de reglas activas en `dias.json` (1 en el día 1, hasta 7 en el día 7) y el `objetivoVisitantes` (6 en días 1-5, 8 en días 6-7). Propuesta de escalado económico coherente con eso:

- La ganancia por acierto (+2) y la pérdida por error (-5) se mantienen fijas — cambiarlas por día complicaría leer el HUD sin necesidad.
- El cobro diario propuesto (punto 4 de la tabla) sí debería escalar con el número de reglas activas del día: `costoDiario = 2 + reglasActivas.length`, para que los días 6-7 (más reglas, más visitantes) presionen más el dinero acumulado.
- `RICH_BOSS_MONEY = 300` se mantiene sin cambios por ahora (decisión en sección 8): el cobro diario propuesto resta entre 4 y 9 por día (días 2 a 7, ~39 en total en una partida completa), notorio pero no debería volver inalcanzable el umbral jugando rápido y limpio. Es un valor a confirmar con playtesting una vez implementado, no algo para recalcular a mano hoy.

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
- **Cobro diario y dinero en negativo:** resuelto — el cobro diario resta como cualquier evento económico, puede dejar `#money` negativo, y eso NO es una condición de derrota nueva. Se gana dinero si se gana la partida, se pierde si se pierde; no hay un "game over por no poder pagar".
- **Ubicación en la UI de pistas/seguro (compras 3-5 de la sección 3):** botón nuevo en el HUD junto al de pausa, que abre un panel simple tipo "Tienda" con las opciones de compra, deshabilitado si no alcanza el dinero. No va en Opciones (esa pantalla es configuración global, no acciones de una partida en curso).
- **Recalibrar `RICH_BOSS_MONEY`:** se mantiene en 300 por ahora; revisar con playtesting después de implementar el cobro diario, y bajarlo a ~250 como primer ajuste si en la práctica queda inalcanzable.
- **Pantalla de resumen de día:** confirmado — se agrega una línea aparte para el cobro diario en `#day-summary-screen`, separada de "Dinero ganado" por decisiones, para que el jugador entienda de dónde sale cada número.

No quedan preguntas abiertas pendientes de discutir con Mike por ahora.
