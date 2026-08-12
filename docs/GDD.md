***Historia:***

Eres un nuevo oficial de la Agencia de Aduana Espiritual, contratado el mismo día en que empieza tu turno (Día 1), sin inducción ni manual de bienvenida. Tu trabajo es revisar los pasaportes de quienes cruzan hacia el mundo humano y decidir si los dejas pasar, según las reglas que la agencia va confirmando día a día sobre los Yokai.

Tono: humor.

**Final de derrota** (al llegar a 5 errores, sin importar el día): te despiden en el acto y el apocalipsis Yokai se desata sobre la Tierra — nadie más tenía la vista tan fina como la tuya para este trabajo. *(borrador)*

**Final de victoria** (completar los 5 días sin llegar a 5 errores): salvaste el mundo. Como agradecimiento, la agencia te asciende a Jefe de Sección (con oficina nueva, aunque sin ventana) y además te regalan un unicornio de peluche gigante que insiste en llamarse "Su Majestad". *(borrador)*

----------------------------------------

***Mecánicas:***

- Cada día llegan 6 visitantes.
- Cada visitante tiene un pasaporte (nombre, región, especie declarada, color de sello) y un rostro compuesto por capas visuales (rostro con torso y cabello incluidos, ojos, boca, cuernos, sombrero — placeholders CSS hasta tener arte real, que hará Mike).
- El jugador decide: aceptar o rechazar.
- Cada día se activa una regla nueva; las reglas de días anteriores se mantienen activas (ver `public/data/reglas.json`).
- Acertar suma dinero (+10); fallar resta dinero (-5) y suma 1 error. El dinero es solo puntaje visual, no afecta la derrota.
- Al llegar a 5 errores acumulados se pierde la partida, sin importar el día.
- Frase aleatoria al llegar cada visitante (`public/data/frases.json`), sin efecto en la mecánica — solo humor.

----------------------------------------

***Objetivos:***

- Sobrevivir los 5 días sin acumular más de 5 errores.
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

Ver `public/data/reglas.json` — 5 reglas acumulativas, una nueva por día:

1. Oni: cuernos visibles (el sello negro NO es prueba por sí solo).
2. Kitsune: ojos amarillos.
3. Kappa: región declarada = "río".
4. Mentira: la especie declarada aparece recién desde este día (antes está oculta) — ningún Yokai declara su especie real, puede decir "humano", otra especie, o cualquier tontería. Se descubre comparando lo declarado contra lo observado (cuernos, ojos amarillos, región río).
5. Sello negro en el pasaporte (documento falsificado), aplica a todos.

Colores de sello (`public/data/sellos.json`): dorado y rojo son decorativos, negro es el único que causa rechazo (desde el día 5).

Especies declaradas (`public/data/species.json`): incluye las 3 especies de Yokai, "humano", y varias opciones sin sentido (para que ni Humanos ni Yokai tengan un patrón fijo de qué declaran) — tanto Humanos como Yokai sortean su especie declarada de esta misma lista.

----------------------------------------

***Personajes:***

- 3 especies de Yokai (Oni, Kitsune, Kappa) + Humano (ver `public/data/yokais.json`).
- Nombres tomados al azar de `public/data/nombres.json`.
- Cada visitante puede tener una frase aleatoria al llegar (`public/data/frases.json`).
- Campos visibles del pasaporte: nombre, región, especie declarada, color de sello. Sin número de documento ni fecha — se mantiene simple.

----------------------------------------

***Progresion***

5 días, una regla nueva por día (acumulativa), y la proporción de visitantes "problemáticos" sube día a día (día 1 ≈ 1 de 6, día 5 ≈ 3-4 de 6).

----------------------------------------

***HUD***

Día actual, contador de errores (máx. 5), contador de dinero (visual).

----------------------------------------

***Flujo***

Menú → Día N: por cada uno de los 6 visitantes se muestra pasaporte + rostro, el jugador decide, hay feedback inmediato (correcto/error) → al completar los 6, pantalla de resultado del día con el texto introductorio del día siguiente → se repite hasta el día 5 o hasta llegar a 5 errores → pantalla final.

----------------------------------------

***MVP:***

Todo lo descrito arriba. Sin tutorial, sin historial completo de partidas (solo top 3 en el menú), con placeholders CSS en vez de imágenes reales para las partes visuales.

----------------------------------------

***Versiones Futuras?:***

Reemplazar placeholders por arte real; darle algún uso al dinero (mejoras, cosméticos); más reglas/días; más frases aleatorias.
