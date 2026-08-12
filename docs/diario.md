Dia 1: 

se esta creando el esqueleto del proyecto, directorios, archivos informativos (docs), aun no se programa nada

---

2026-08-10:

Repaso de la arquitectura antes de programar en serio: se decidió no crear `Appearance`, `CharacterFactory` ni `UIManager` como clases separadas para no sobrecomplicar el proyecto en el tiempo disponible. En esa misma sesión se definieron las 3 especies de Yokai (Oni, Kitsune, Kappa), sus rasgos distintivos, las 5 reglas del juego (una por día, acumulativas) y la historia base del GDD. También en este punto se acordó programar todo en inglés (nombres de clases, campos y métodos), a diferencia de los documentos de diseño que quedaron en español.

Se programó las clases de personajes: `Passport`, `Character` (abstracta), `Human` y `Yokai`, con sus campos privados, getters, y los métodos `dialogueLine()` y `specieLiar()` (este último pensado para sobreescritura/polimorfismo). Iralys programó `Rule`, `Day` y `Storage`.

Se configuró el proyecto para compilar TypeScript a JavaScript plano (`package.json` + `tsconfig.json`, sin frameworks ni bundlers).

Se integraron ambas partes por primera vez: rama `objetosMike` y rama `objetosIralys` fusionadas a `develop`. Durante la integración aparecieron algunas inconsistencias esperables entre partes escritas por separado (nombres de métodos y estilo de import), que se revisaron y corrigieron antes de dar la integración por cerrada. Queda pendiente `Game.ts` (la clase que conecta ambas partes) y la interfaz (`main.ts` + HTML/CSS) quedan como el siguiente trabajo conjunto.

---

Se creó Game.ts, la clase que coordina la partida completa: carga de datos, generación de visitantes, decisión del jugador, avance de días, condición de victoria/derrota y guardado de progreso.

Se armó una batería de pruebas simuladas (partidas jugadas automáticamente desde un script aparte, sin interfaz todavía) para verificar el comportamiento de Game.ts antes de conectarlo a la interfaz. Se encontró y corrigió un bug real: loadData() iniciaba un día nuevo por su cuenta, lo cual pisaba el progreso guardado antes de que loadProgress() pudiera restaurarlo. Se corrigió separando esa responsabilidad en un método público nuevo, startNewGame().

---

Se probó Game.ts con 8 casos de prueba distintos, simulando partidas completas sin interfaz todavía: partida perfecta hasta la victoria (con auditoría de reglas activas y proporción de visitantes problemáticos por día), partida con errores forzados hasta la derrota, guardado y carga de progreso a mitad de partida, límite de 3 resultados en el historial, mezcla de aciertos y errores dentro de un mismo día, el caso límite de perder justo en el último visitante del día, consistencia de specieLiar() en volumen, e integridad del historial y de la partida guardada al terminar el juego. Los 8 casos pasaron.

el archivo de testeo se encuentra en docs, y el comando para correrlo es: 
```
node test-temporal.mjs
``` 

---

2026-08-12:

Se creo el arte real de los personajes (24 rostros base y 17 pares de ojos, más un ojo amarillo aparte para los Kitsune), reemplazando los placeholders CSS que se habían usado hasta ahora. El posicionamiento de ojos y boca sobre cada rostro se midió a pixel (análisis con PIL sobre la zona del óvalo de la cara) para que no se sobrepongan en los rostros donde el cabello llega más abajo.

Durante la integración del arte apareció un bug de parpadeo: la imagen del personaje aparecía un instante y desaparecía, o directamente no cargaba. La causa era que el navegador no llegaba a precargar las imágenes antes de asignarlas como `background-image`. Se resolvió agregando `preloadImages()`/`preloadCharacterImages()` en `main.ts`, que precargan todas las variantes apenas arranca el juego. (Un segundo síntoma parecido, una URL `blob:` reemplazando la imagen, resultó ser causado por la extensión DarkReader del navegador, no por el código. xD )

Se agregaron también las 50 frases de humor negro a `frases.json`.

---

Con ambas partes (`objetosMike` y `objetosIralys`) ya bastante avanzadas por separado, se abrió una rama de prueba (`revision-temporal`) para fusionar el trabajo de los dos sin arriesgar ninguna de las dos ramas originales. Se compiló todo junto y se encontraron 3 errores de integración, revisados uno por uno con Mike antes de aplicar la corrección:

1. `Rule.ts` (de Iralys) llamaba a un par de metodos en espanol en las clases reales (`tieneCuernosVisibles()`, `obtenerPasaporte()`, etc.) — se corrigió para que llame a los métodos reales en inglés (`obtainHaveHorns`, `obtainPassport`, etc.), sin tocar el `switch`, ni otras partes de su trabajo. 

2. `main.ts` (de Iralys) todavía hacía referencia a `obtainNose`/`obtainEar`, campos que ya se habían eliminado del lado de Mike al simplificar el arte (nariz y orejas fuera, boca en su lugar) y no le informo hasta que la clase ya estaba creada y se integro todo para probarlo. Se corrigió para usar `obtainMouth`, y se agregó el uso de `obtainYellowEyes` para elegir la imagen de ojos correcta.

3. Al fusionar automáticamente, `index.html` y `style.css` habían quedado con la versión de Iralys (placeholders, sin las reglas CSS del arte real). Se recuperaron algunas referencias en el css temporal de mike y el posicionamiento medido a pixel desde un stash local, conservando la estructura de IDs y clases que programó Iralys.

Con las 3 correcciones aplicadas, Mike probó el juego completo en el navegador: frases, personajes, pasaportes y conteo de errores funcionando correctamente. Se confirmó además (releyendo `convenciones.md`) que se se esta limitando en lo posible el juego a lo visto en clases como senalo el profesor Jano

---

Jugando la versión integrada se notó que mostrar la especie declarada del pasaporte desde el día 1 delataba demasiado obvio a los Yokai (un Oni que declara "oni", etc.), le quitaba gracia al juego. Se decidió:

- Ocultar el campo "especie declarada" del pasaporte hasta el día 4, que es cuando se activa la regla de la mentira.
- Generalizar la mentira: ya no mienten solo los Yokai que antes declaraban "humano" — desde el día 4, **ningún** Yokai reconoce su especie real. Puede declarar ser humano, otra especie de Yokai, o directamente una tontería (espíritu del bosque, pez, silla eléctrica, fantasma de biblioteca, nube con forma de gato, extraterrestre de vacaciones). La única forma de descubrir la mentira es comparar lo declarado contra lo que se observa (cuernos, ojos amarillos, región río).
- Se creó `public/data/species.json` con el pool compartido de especies, del que sortean tanto los Yokai (excluyendo su especie real, para garantizar que mientan) como los Humanos honestos (así tampoco hay un patrón fijo de qué declara cada tipo de personaje).
- `Yokai.specieLiar()` se generalizó: en vez de comparar contra un caso hardcodeado, ahora deduce la "especie aparente" a partir de los rasgos observables y la compara contra la declarada.
- Se reescribieron el mensaje de introducción del día 4 (`dias.json`) y la descripción de la regla 4 (`reglas.json`) para explicar la nueva mecánica.

Al correr `test-temporal.mjs` con el cambio, el TEST 7 marcó 8 inconsistencias — pero el error estaba en el propio script de prueba, que todavía calculaba el valor esperado con la lógica vieja y no contemplaba que los Humanos ahora también declaran una especie al azar (aunque `Human.specieLiar()` sigue siendo `false` fijo, sin importar lo que declaren). Se corrigió el test importando `Yokai` y comparando solo cuando el visitante es instancia de esa clase. Con eso, los 8 tests vuelven a pasar sin inconsistencias.
