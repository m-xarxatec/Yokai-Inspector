***Historia:***

Eres un nuevo oficial de la Agencia de Aduana Espiritual, contratado el mismo día en que empieza tu turno (Día 1), sin inducción ni manual de bienvenida. Tu trabajo es revisar los pasaportes de quienes cruzan hacia el mundo humano y decidir si los dejas pasar, según las reglas que la agencia va confirmando día a día sobre los Yokai.

Tono: humor.

**Final de derrota** (al llegar a 4 errores, sin importar el día): te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo. *(borrador)*

**Final de victoria** (completar los 7 días sin llegar a 4 errores): salvaste el mundo. Como agradecimiento, la agencia te asciende a Jefe de Sección (con oficina nueva, aunque sin ventana) y además te regalan un unicornio de peluche gigante que insiste en llamarse "Su Majestad". *(borrador)*

----------------------------------------

***Mecánicas:***

- Cada día llegan 6 visitantes (8 desde el día 6).
- Cada visitante tiene un pasaporte (nombre, región, especie declarada, color de sello) y un rostro compuesto por capas visuales (rostro con torso y cabello incluidos, ojos, boca, cuernos, sombrero).
- El jugador decide: aceptar o rechazar.
- Cada día se activa una regla nueva o cambia alguna existente; las reglas de días anteriores se mantienen activas salvo aviso explícito (ver `public/data/reglas.json` y el día 6, que da de baja una regla vieja).
- Acertar suma dinero (+10); fallar resta dinero (-5) y suma 1 error. El dinero es solo puntaje visual, no afecta la derrota.
- Al llegar a 4 errores acumulados se pierde la partida, sin importar el día.
- Cada visitante tiene un tiempo límite para decidir (baja con cada día); si se acaba, cuenta como error automático. Tras 2 errores seguidos se activa un "modo alerta" temporal: el tiempo límite se reduce a la mitad hasta el próximo acierto.
- Frase aleatoria al llegar cada visitante (`public/data/frases.json`); a veces, con más frecuencia si el visitante es problemático, dice una frase con una pista sutil (`public/data/frases_sospechosas.json`) — no es 100% confiable, un visitante honesto también puede decir una por casualidad.

----------------------------------------

***Objetivos:***

- Sobrevivir los 7 días sin acumular más de 4 errores.
- Detectar correctamente a los Yokai según las reglas activas cada día, sin dejarse engañar por los señuelos (sello negro antes del día 5, orejas grandes — nunca son prueba por sí solos).

----------------------------------------

***Pantallas:***

- **Menú principal**: "Iniciar nuevo juego" / "Continuar partida" (solo visible si hay una partida sin terminar guardada) + tabla estilo arcade con los últimos 3 resultados guardados.
- **Pantalla de juego**: día actual, visitante actual (pasaporte + rostro), botones aceptar/rechazar.
- **Pantalla de resultado del día**: resumen de aciertos/errores del día, texto de introducción del día siguiente.
- **Pantalla final**: victoria o derrota, según el resultado.

Sin tutorial. Sin pantalla de historial completo (solo el top 3 en el menú).

----------------------------------------

***Reglas:***

Ver `public/data/reglas.json` — 6 reglas, la mayoría acumulativas (ver excepción del día 6):

1. Oni: cuernos visibles (el sello negro NO es prueba por sí solo). **Deja de aplicar desde el día 6** (ver más abajo).
2. Kitsune: ojos amarillos.
3. Kappa: región declarada = "río".
4. Mentira: la especie declarada aparece recién desde este día (antes está oculta) — ningún Yokai declara su especie real, puede decir "humano", otra especie, o cualquier tontería. Se descubre comparando lo declarado contra lo observado (cuernos, ojos amarillos, región río).
5. Sello negro en el pasaporte (documento falsificado), aplica a todos.
6. Sello plateado en el pasaporte (falsificación de una aduana rival), aplica a todos. Activa desde el día 7.

**Día 6, la regla de los cuernos se da de baja:** la agencia descubre que los cuernos se pueden disimular con cascos rituales, así que dejan de ser prueba válida por sí solos. No es un agujero de dificultad real: la regla 4 (mentira de especie), activa desde el día 4, ya detecta a cualquier Oni por su declaración sin depender de los cuernos — el giro es para que el jugador no memorice "rechazar cuernos" en piloto automático y siga prestando atención a la declaración.

Colores de sello (`public/data/sellos.json`): dorado y rojo son decorativos, negro causa rechazo desde el día 5, plateado desde el día 7.

Especies declaradas (`public/data/species.json`): incluye las 3 especies de Yokai, "humano", y varias opciones sin sentido (para que ni Humanos ni Yokai tengan un patrón fijo de qué declaran) — tanto Humanos como Yokai sortean su especie declarada de esta misma lista.

----------------------------------------

***Personajes:***

- 3 especies de Yokai (Oni, Kitsune, Kappa) + Humano (ver `public/data/yokais.json`).
- Nombres tomados al azar de `public/data/nombres.json`.
- Cada visitante puede tener una frase aleatoria al llegar (`public/data/frases.json`).
- Campos visibles del pasaporte: nombre, región, especie declarada, color de sello. Sin número de documento ni fecha — se mantiene simple.

----------------------------------------

***Progresion***

7 días. Los días 1-5 suman una regla nueva por día (acumulativa); el día 6 da de baja la regla de los cuernos (ver sección de Reglas) y el día 7 suma la regla del sello plateado. La proporción de visitantes "problemáticos" sube día a día (día 1 ≈ 1 de 6, día 5 ≈ 3-4 de 6, días 6-7 ≈ 7 de 8). Los días 6-7 también suman más visitantes por día (8 en vez de 6).

----------------------------------------

***HUD***

Día actual, contador de errores (máx. 4, se pone en rojo con 3 o más), barra de tiempo por visitante (se acorta y cambia de color en "modo alerta"), racha de aciertos, contador de dinero (visual).

----------------------------------------

***Flujo***

Menú → historia → intro del día 1 → Día N: por cada visitante del día (6, u 8 desde el día 6) se muestra pasaporte + rostro, el jugador decide, hay feedback inmediato (correcto/error) → al completar el día, pantalla de resultado con el texto introductorio del día siguiente → se repite hasta el día 7 o hasta llegar a 4 errores → pantalla final.

----------------------------------------

***MVP:***

Todo lo descrito arriba. Sin tutorial, sin historial completo de partidas (solo top 3 en el menú). Arte real puesto (rostros, ojos, bocas, fondos de la escena).

----------------------------------------

***Versiones Futuras?:***

Darle algún uso al dinero (mejoras, cosméticos); modo difícil desbloqueable tras ganar (ver `docs/ideas.md`); más reglas/días; más frases aleatorias.
