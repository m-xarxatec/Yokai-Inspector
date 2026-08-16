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

---

Mike terminó el arte de bocas y narices (18 variantes, dibujadas juntas en una sola imagen por variante) y los 3 fondos de la escena completa (`general_background`, `window` y `desktop`, la ventanilla y el escritorio de la oficina). Se armó `#character-scene` como contenedor de 4 capas en el orden fondo → personaje → ventanilla → escritorio, midiendo a píxel (análisis del canal alfa con PIL) la apertura de la ventanilla en `window.png` para ubicar al personaje ahí adentro. Después de probarlo se ajustó dos veces más a pedido de Mike: bajar un poco al personaje dentro de la escena (para que el escritorio le tape bien la parte de abajo) y agrandar un poco la pantalla de juego completa, porque costaba distinguir los ojos amarillos de los Kitsune.

---

Con el juego ya jugable de punta a punta, se sumaron 5 mejoras de presentación que faltaban:

- Una intro narrativa antes del día 1: al iniciar partida nueva ahora se ve primero la historia (por qué el jugador está ahí) y después el mensaje del día 1, cada uno con su botón "Siguiente", antes de entrar recién a la oficina. "Continuar partida" se salta esto, va directo al juego.
- El diálogo del visitante ya no aparece de golpe: se escribe solo, palabra por palabra, como un subtítulo.
- El personaje ya no aparece ni desaparece de la nada: entra deslizándose desde la derecha cada vez que llega un visitante nuevo, y sale para la izquierda si se acepta o de vuelta para la derecha si se rechaza (por donde vino).
- Se agregó un meneo idle simple (arriba/abajo, lento y constante) al personaje, independiente del deslizamiento porque usa una propiedad CSS distinta.
- El menú de partidas guardadas se rehizo: la tabla de historial ahora muestra el día con más contexto y un ícono/color distinto para victoria y derrota, y aparece un aviso de "partida pausada" con el día en que quedó, si hay una guardada.

---

Con el juego ya con arte real y buena presentación, tocaba la primera tanda de dificultad real, para que dejara de sentirse una demo. Cuatro cambios, elegidos porque no tocan la lógica ya probada de `Game.decide()`/`isLost()`/`isWon()`:

- **Idea de Iralys**: agregarle presión de tiempo a cada visitante. Se implementó como una barra que se achica (más rápido en los días avanzados); si se acaba el tiempo, cuenta como error automático — resuelto sin agregar ningún método nuevo a `Game`, calculando la respuesta correcta desde `main.ts` con la API que ya era pública (`currentDay.evaluateCharacter`) y pasándole a `decide()` la respuesta contraria a propósito.
- El margen de error total bajó de 5 a 4.
- Racha de aciertos y aviso visual quedan-pocos-errores en el HUD.
- Los visitantes problemáticos dejaron de apuntar a una sola regla: ahora, además del rasgo principal, pueden sortear un rasgo sospechoso extra de otra regla que ya esté activa (región río o sello, según corresponda), para obligar a revisar todo el pasaporte y no memorizar "el rasgo del día". De paso se encontró y arregló un detalle de `Yokai.specieLiar()`: el orden de sus 3 comprobaciones podía clasificar mal la "especie aparente" de un visitante con más de un rasgo a la vez — se reordenó para que el rasgo que define el tipo real siempre gane.

---

Segunda tanda, pensada para que la partida no se sienta corta una vez que se le agarra la mano, con Mike pidiendo explícitamente que el código nuevo fuera legible sin depender de comentarios:

- El juego pasó de 5 a 7 días. El día 6 da de baja la regla de los cuernos (excusa narrativa: se pueden disimular con cascos rituales) sin bajar la dificultad real, porque la regla de la mentira de especie ya detecta a cualquier Oni de todos modos. El día 7 suma una regla nueva reusando la propiedad `"sello"` de `Rule.ts` con un color nuevo (plateado), sin tocar el switch de Iralys. Los días 6-7 también suben a 8 visitantes.
- Frases con pista: nuevo `frases_sospechosas.json`, con más probabilidad de aparecer en visitantes problemáticos (50%) que en honestos (12%), para que sea una pista y no una prueba infalible.
- Modo alerta: dos errores seguidos parten el tiempo del visitante a la mitad hasta el próximo acierto.
- El modo difícil desbloqueable tras ganar (New Game+) se propuso pero se dejó explícitamente afuera, anotado en `docs/ideas.md` para más adelante.

---

Ya jugándolo, Mike encontró dos cosas para ajustar:

- El temporizador debía poder desactivarse — se agregó un botón en el menú ("Desactivar temporizador") que lo prende/apaga sin tocar el resto de la dificultad.
- Algunos Yokai aparecían con demasiadas señales a la vez (cuernos + región río + sello, los tres juntos), lo que los hacía obvios en vez de generar duda. La causa era que el sorteo de "rasgo extra" tiraba dos monedas independientes (una para región, otra para sello) que podían salir las dos a la vez. Se corrigió para que se elija como máximo un rasgo extra, nunca dos.

Por último, `frases_sospechosas.json` se amplió de 8 a 50 frases, reescritas con el mismo formato de humor negro ("cómo morí") que las 65 de `frases.json`, para que no se note la diferencia de tono entre unas y otras.

---

Iralys avisó que había subido trabajo nuevo a su rama (`objetosIralys`) por su cuenta: un menú con arte real (imagen de fondo con botones invisibles superpuestos, medidos a píxel), campo de nombre del inspector, un sistema de "créditos" (dinero total acumulado por nombre) y pantallas de opciones/créditos/salir. Se revisó su rama sin fusionarla (venía de antes de toda la segunda tanda de dificultad, y sobre una arquitectura de páginas separadas en vez de la de una sola página que ya tenemos armada) para ver qué convenía traer.

Se decidió con Mike: mantener la arquitectura de una sola página (todo lo que se construyó — intro, animaciones, temporizador, escena por capas — depende de eso), pero sí adoptar el menú que hizo Iralys y el sistema de nombre/créditos, adaptado a la base actual (7 días, 4 errores, todo lo demás sin tocar). Se integró:

- La imagen de fondo del menú (con el título y los 5 botones ya dibujados) y los botones invisibles posicionados en las mismas coordenadas que ella midió.
- El campo de nombre del inspector y el panel de historial, movidos a una barra lateral responsiva.
- Tres pantallas nuevas dentro del mismo sistema de `changeState()`: Opciones (donde se mudó el botón de desactivar el temporizador), Créditos (ranking de dinero total por nombre) y Salir.
- `Storage.ts`: `savePlayerName`/`loadPlayerName`/`addCredits`/`getAllCredits`, agregado sin tocar nada existente.
- `Game.ts`: cambio chico y acotado — el constructor ahora acepta un nombre de jugador (por defecto "Jugador"), y las dos veces que ya se guardaba el resultado en el historial ahora también guardan el nombre y suman créditos. Ni los días, ni el máximo de errores, ni el generador de visitantes se tocaron.

Jugándolo aparecieron 3 cosas para ajustar, pedidas por Mike:

- El botón "Continuar" quedaba tapado por un fondo sólido cuando estaba deshabilitado (sin partida guardada), en vez de solo verse atenuado — la regla `button:disabled` del proyecto tenía más especificidad que la clase de los botones invisibles del menú y le pintaba un color encima, ocultando el arte dibujado. Se corrigió fijando el fondo transparente también en el estado deshabilitado.
- El campo de nombre no tenía botón para confirmar. Se convirtió en un formulario (input + botón "Guardar", también funciona con Enter): al confirmar guarda el nombre, limpia el campo, y lo deja visible aparte como "Inspector: nombre".
- Se agregó un botón "Volver al menú" disponible desde la historia, el juego (dentro del HUD) y el resultado del día — no hizo falta tocar `Game.ts` para esto: como la partida guardada solo se actualiza al empezar cada día, salir a mitad de un día deja el mismo estado que si se recargara la página, y "Continuar partida" retoma desde el inicio de ese día. Sí hubo que limpiar a mano el temporizador y el intervalo del diálogo animado al salir, para que no sigan corriendo de fondo en el menú.

---

Mike sumó una tanda grande de arte nuevo: dos fondos (uno nuevo para el menú, otro para la pantalla de derrota), 4 cuadros de una moneda girando, y "la Jefa" — un personaje nuevo que va a explicar las reglas entre días — con 5 variantes de la pose "explicando" (más otras de enojo/susto/decepción que quedan guardadas para más adelante). El protagonista y los documentos (pasaporte, promesa, volante especial) también se subieron pero se dejaron sin integrar todavía.

Como el fondo nuevo del menú (`fondoInicio2.png`) no trae el título ni los botones dibujados —a diferencia del arte de Iralys—, el menú pasó a usar botones HTML reales encima de la imagen en vez de los hotspots invisibles medidos a píxel. Se integró también: la moneda girando (recortada y reducida, ciclo de ida y vuelta con `setInterval` para que no se vea el salto entre el último cuadro y el primero), y la pantalla de resultado del día rediseñada con el fondo de la oficina desenfocado y la Jefa encima (una de las 5 variantes, al azar); para esto se generalizó `typeDialogue()` (antes fija a la burbuja del visitante) para que reciba a qué elemento apuntar.

Jugándolo aparecieron varios bugs y ajustes, todos probados en el navegador antes de darlos por buenos:

- **Bug real, no solo estético**: `#final-screen` tenía `display: flex` puesto directo por ID, que le ganaba en especificidad a la clase `.hidden` — la pantalla final nunca se ocultaba de verdad, así que su mensaje (vacío la mayoría del tiempo) y su botón "Volver al menú" quedaban flotando debajo de cualquier pantalla, incluido el menú principal. Se confirmó con el navegador antes de tocar nada. Se corrigió agregando `#final-screen.hidden { display: none }`, que sí le gana en especificidad.
- La pantalla de derrota se rediseñó: la imagen ahora vive en su propio cuadro (`#final-scene`) con el mismo `aspect-ratio` que el arte, así se ve completa sin recortar; el texto se movió abajo (antes se superponía a la imagen) y ahora también se "habla" con `typeDialogue()`, igual que el resto de los diálogos.
- La moneda "no se veía nunca": el motivo real era que vivía adentro de `#money-counter`, y cada vez que `renderVisitor()` actualizaba el texto del dinero (`textContent = ...`) borraba a la moneda con él. Se sacó a un widget aparte (`#coin-widget`, moneda arriba, dinero abajo), separado de la barra del HUD.
- La Jefa se agrandó y sus 5 imágenes se reprocesaron recortadas a su contenido real (antes tenían margen transparente disparejo entre variantes), para que la base coincida exacto con la base del fondo desenfocado.
- La pantalla de juego se agrandó (`#game-screen` y `#character-scene` ahora comparten una variable CSS, `--game-max-width`, subida de 560/640px a 760px) para dejar lugar al pasaporte que se va a montar sobre el escritorio. El widget de la moneda, que antes quedaba pegado al borde de la ventana en pantallas anchas, ahora se calcula pegado al borde de esa misma columna.
- Se conversó si convenía agregar una opción de tamaño de pantalla configurable (como en juegos clásicos) — se decidió no hacerlo todavía: el layout ya es por porcentaje/`aspect-ratio`, así que agregarlo después sale barato: mejor subir el tamaño fijo primero y ver cómo queda con el resto del arte puesto.

---

Con la escena ya más grande, se rehizo el arranque de una partida nueva. Antes el nombre del inspector se pedía en un campo suelto del menú; ahora "Nueva partida" lleva primero a una pantalla propia (`#name-entry-screen`, con su propio formulario) y, al confirmar el nombre, a una pantalla de bienvenida personalizada (`#story-screen`) que usa el arte del protagonista (`protaFeliz.png`) y "habla" con `typeDialogue()` igual que el resto de los diálogos, saludando al jugador por su nombre antes de entrar al día 1. "Continuar partida" sigue saltándose todo esto, como ya hacía con la intro vieja.

---

Empezó la parte más larga de esta tanda: reemplazar la barra de texto que hacía de pasaporte (Nombre/Región/Especie declarada/Sello en texto plano, arriba de la pantalla) por el pasaporte real que Mike dibujó — cerrado y abierto, más los 4 sellos de autenticidad (dorado, rojo, negro, plateado; los de aceptado/rechazado quedaron con un placeholder de texto, todavía sin arte). Se armó `#passport-object` dentro de `#character-scene`, apoyado sobre el escritorio, con dos estados (`.cerrado`/`.abierto`) que cambian de imagen, tamaño y aspect-ratio, y el sello correcto elegido por clase a partir de `obtainStamp()` (con el cuidado de que el dato dice `"plateado"` pero el archivo se llama `selloPlata.png`, no son el mismo string). El texto del pasaporte (nombre/región/especie) se pintó en la hoja izquierda del pasaporte abierto, en el marco que el arte ya traía pensado para eso; la regla de ocultar la especie declarada hasta el día 4 no se tocó, solo se movió de lugar.

De ahí en más, cada vez que Mike lo probaba en el navegador salía un pedido de ajuste, y cada uno cambió el mecanismo un poco más que el anterior — vale la pena dejarlos todos anotados porque el resultado final es bastante distinto de la primera versión:

1. **Primera versión**: el pasaporte se deslizaba junto con el personaje (mismo mecanismo de `left`, sincronizado), cerrado, y se abría solo con un pequeño delay al llegar.
2. **Se separó de la entrada del personaje**: no daba la sensación de "entrega" si aparecía deslizándose al mismo tiempo que el personaje. Se cambió a que el personaje llegue solo y termine de asentarse (ya con la animación idle arriba/abajo) antes de que el pasaporte aparezca — con una pausa a propósito en el medio para que se sienta como que lo entrega, no que lo trae consigo.
3. **Apertura por click, no automática**: a propuesta de Mike, se evaluó si convenía que el pasaporte no se abra solo, y que el jugador tenga que clickearlo — encaja con el espíritu de "inspeccionar" del género (como Papers, Please) y es más simple de implementar que un timer. Se sumó también el gateo real: Aceptar/Rechazar quedan deshabilitados hasta que el pasaporte esté abierto, así que ya no se puede decidir a ciegas sin leerlo.
4. **La devolución no desaparecía de verdad**: al principio, al decidir, el pasaporte solo se achicaba y quedaba quieto en un punto fijo — visible, pequeño, pegado ahí — en vez de desaparecer. Se corrigió ocultándolo del todo (`display: none`) mientras no está en tránsito.
5. **La animación final, en arco**: el pedido terminó de definirse como que el personaje "lanza" el pasaporte desde su base, a través de la ventanilla, y cae con rebote sobre el escritorio — y exactamente lo mismo al revés al decidir. Esto ya no se podía resolver con un simple `transition` de CSS (hace falta una trayectoria curva, no en línea recta), así que se escribió a mano una curva de Bézier cuadrática en JS (`animatePassportAlongArc()`), con el tamaño del pasaporte interpolado en el mismo recorrido (chico en tránsito, más grande al llegar). El rebote al aterrizar se logró con una curva `cubic-bezier` (igual a las que usa CSS en `animation-timing-function`) evaluada a mano con el método de Newton-Raphson, porque hacía falta el valor exacto en cada cuadro para mover el elemento, no solo una transición pasiva.
6. **Ajustes de sensación, ya sobre el arco terminado**: el rebote se suavizó (los valores de `cubic-bezier` que Mike había propuesto daban un golpe muy brusco), el arco se hizo más alto (subiendo el punto de control bien por encima de la escena), y se corrigió que se lo siguiera viendo por encima del escritorio y la ventanilla durante el vuelo — para esto, `animatePassportAlongArc()` calcula en cada cuadro si el pasaporte debe pasar a un `z-index` más bajo que la ventanilla/el escritorio (dando la sensación de que cruza detrás), con una señal distinta según la dirección: tiempo transcurrido para la devolución, y "¿ya pasó el punto más alto del arco?" para la entrega (un umbral de tiempo fijo no alcanzaba, porque el arco es asimétrico).

Con todo el mecanismo ya estable, se hizo una revisión completa del código agregado contra `docs/convenciones.md` — se encontraron y corrigieron dos cosas chicas: dos funciones nuevas (`animatePassportAlongArc`, `createCubicBezierEasing`) habían quedado con nombre en español, rompiendo el único patrón 100% consistente de todo `main.ts` (nombres de función siempre en inglés); y un comentario de `style.css` sobre `#passport-object` todavía citaba una constante (`PASSPORT_DELIVERY_*`) eliminada en la reescritura del arco. Se corrigieron ambas. El resto del código nuevo ya cumplía la convención sin excepciones — con la salvedad, ya existente en el resto del proyecto, de que `X | null` se usa en todos lados porque es la única forma de expresar "esto puede no existir" con el chequeo estricto de nulos de TypeScript activado, no un modelado del dominio con tipos unión (eso sigue resuelto con herencia real, `Character`/`Human`/`Yokai`).

---

2026-08-14 (Iralys, rama `actualIralys`):

Sesión centrada en la pantalla de inicio, con varias correcciones e ideas propuestas por Iralys.

Iralys se encargó de rediseñar por completo la pantalla de inicio, tomando como base la estructura que ya tenía el juego (mismo sistema de `changeState()`, misma imagen de fondo con botones reales encima) pero corrigiendo scroll donde no debería. Iralys ajustó el CSS para que la imagen se vea entera sin recortes, sin activar scroll en ningún dispositivo (PC, tablet o portátil), y para que el panel de historial quede acomodado debajo del personaje sin invadir el resto de la escena.

Dos ideas propuestas por Iralys, todavía sin implementar:

- Agregar un pequeño tutorial visual sobre la barra de tiempo. Como la mecánica es nueva para cualquiera que juegue por primera vez, la idea es dejar claro qué significa que la barra se achique y qué pasa si llega a cero, en vez de que el jugador lo descubra recién perdiendo por primera vez sin entender bien por qué.
- Agrandar el pasaporte un poco más de lo que está ahora, y en vez de que los datos mostrados sean siempre consistentes con la realidad del visitante, mezclar información simulada — algunos datos correctos y otros deliberadamente falsos o contradictorios entre sí — para que inspeccionar el pasaporte se sienta más parecido a un desafío real de detective y menos a un simple trámite de "leer y decidir". Queda anotada para implementarse más adelante, sin tocar todavía la lógica de `Rule.ts` ni `Game.ts`.

También subió `Fondopersonaje.png`, una imagen de referencia (no un asset para integrar directo) de cómo podría verse toda la pantalla de juego rediseñada — HUD con iconos, sidebar, pasaporte abierto con texto visible. Mike ya la tiene y la va a usar como guía para trabajar la jugabilidad, no hace falta traerla al repo de nuevo.

Se revisó su rama (`actualIralys`, esta vez basada en nuestro propio `03bb71b`, no en una arquitectura rival) y se trajo a `objetosMike` lo que ya estaba listo para usar sin conflictos: el fondo nuevo del menú (`backgroundEnd.png`, con el título ya dibujado adentro, reemplaza a `fondoInicio2.png`) y la tipografía que eligió (Jost para el cuerpo, Marcellus para títulos) — pero autoalojada en `public/fonts/` en vez de por Google Fonts, para que el juego siga sin depender de internet. Su rama también tenía otra fuente pixel-art (Press Start 2P/Pixelify Sans) pensada solo para el placeholder de texto del sello de aceptado/rechazado — como ese placeholder ya se había reemplazado por el arte real de los sellos (`selloAceptado.png`/`selloRechazado.png`) del lado de Mike, esa fuente no se trajo, y el sello real quedó como estaba, sin tocar.

*(Nota: la elección de Jost/Marcellus de este párrafo se revirtió más abajo — quedó documentado igual porque fue la decisión real de ese momento, con el motivo por el que después cambió.)*

---

2026-08-15 (parte 1) — pasaporte sobre la mesa y sellos reales:

Mike subió arte nuevo: 3 variantes de "pasaporte apoyado sobre la mesa" (`pasaporte1/2/3.png`) y el arte real de los sellos de aceptado/rechazado (`selloAceptado.png`/`selloRechazado.png`, hasta ahora un placeholder de texto con borde). Se integraron:

- Al aterrizar la entrega (cuando el arco termina de caer), el pasaporte cambia de la imagen "en tránsito" (`pasaporte.png`) a una de las 3 nuevas, elegida al azar, dando la sensación de que quedó posado sobre el escritorio. La devolución no usa estas variantes: antes de arrancar el arco de vuelta se sacan de nuevo, así que siempre se devuelve mostrando `pasaporte.png`, igual que al principio.
- `#decision-stamp` dejó de ser texto con borde: ahora es el arte real, sin la rotación que tenía el placeholder (el arte ya viene inclinado de por sí).

Ajustes posteriores, todos pedidos por Mike jugándolo:

- Se le sacó el rebote al arco: la curva `cubic-bezier` con overshoot se cambió por una de desaceleración simple, sin "pasarse" al final.
- El pasaporte abierto quedó más grande, más abajo, y más centrado (antes compartía el `left` del cerrado; ahora tiene el suyo propio, dejando lugar a la derecha para futuros elementos), con una inclinación tipo púlpito de conferencias (`perspective` + `rotateX`, con el "gozne" en la base).
- La imagen de "sobre la mesa" también se agrandó y se bajó un poco (con el punto de llegada del arco, `PASSPORT_ARC_DESK`, sincronizado al mismo valor para que no haya salto al aterrizar).
- **Bug real**: la función del arco (`animatePassportAlongArc`) apaga la transición CSS del pasaporte mientras anima (`transition: none`) pero nunca la volvía a prender — así que, desde la primera entrega en adelante, abrir/cerrar el pasaporte con el click quedaba "cortado" en vez de animarse suave. Se corrigió reactivando la transición al terminar cada arco (tanto en la entrega como en la devolución).

---

2026-08-15 (parte 2) — la tipografía pixel-art, esta vez sí definitiva:

Mike pidió traer de nuevo la rama de Iralys para revisar cambios. En la rama en sí (`actualIralys`/`objetosIralys`, que además consolidó y renombró un poco) no había nada nuevo — pero apareció algo más relevante: **`origin/objetosMike` (la rama remota propia) tenía un commit sin bajar** (`e84ea1e`), donde Iralys ya había empujado directo ahí la tipografía pixel-art completa (Press Start 2P para títulos/acentos cortos, Pixelify Sans para todo el texto funcional — párrafos, botones, tablas). Esto reemplaza la elección de Jost/Marcellus de la sesión anterior. Se aplicó tal cual la pensó Iralys, pero alojada localmente igual que antes (`public/fonts/`, no por Google Fonts), incluidos los ajustes de tamaño (`clamp()`) que ella ya había afinado para que la fuente nueva (de métrica distinta) no quedara apretada en subtítulos, tabla de historial, botones de decisión, etc.

---

2026-08-15 (parte 3) — el menú de Iralys, unificado y adaptado a cualquier pantalla:

Con las fuentes resueltas, tocaba traer el resto del menú nuevo de Iralys (fondo `backgroundEnd.png`, botones con blur, barra lateral). Mike lo probó parándose en ambas ramas (`git checkout` a `actualIralys` y de vuelta) y notó que en la rama de Iralys el menú "se veía desconfigurado".

**El diagnóstico**: su CSS pone `#menu-stage` a pantalla completa (`100vw`/`100vh`) y usa `object-fit: contain` en la imagen para no recortarla — pero los botones y la barra lateral se posicionan como porcentaje de esa caja de PANTALLA COMPLETA, no del espacio real que ocupa la imagen dentro de ella. En cualquier proporción de pantalla distinta a la de la imagen (1536×1024), la imagen queda más chica que el contenedor (aparecen franjas vacías) y los botones se calculan sobre un área más grande que la real, saliéndose del fondo. Probablemente coincidía en la laptop de Iralys por casualidad de resolución, no por diseño.

**La solución**: en vez de que el contenedor sea "pantalla completa a lo bruto", mantiene la proporción real de la imagen (`aspect-ratio: 1536/1024`) y se ajusta al máximo posible sin pasarse de la ventana — los botones y la barra, posicionados como porcentaje de ESE contenedor (no de la ventana), quedan siempre alineados con la imagen real, sea cual sea la pantalla. Mike además pidió que la imagen no ocupe el 100% de la pantalla (se sentía "muy bestia" en su monitor de 27", comparado con la laptop de 14" de Iralys) — se limitó a un máximo de 94% del ancho / 90% del alto, una diferencia chica que casi no se nota en pantallas ya ajustadas pero da un margen visible en monitores grandes. De paso se trajo también la tabla de historial rediseñada (compacta, solo 3 filas, sin scroll), parte de la misma barra lateral.

**Bug real, mismo patrón que ya había pasado con `#final-screen`**: al armar el nuevo `#menu-screen` como overlay de pantalla completa, se le puso `display: flex` directo por ID para centrar el contenido — eso le gana en especificidad a `.hidden` (`display: none`), así que `changeState()` dejaba de poder ocultar el menú de verdad: quedaba fijo tapando todo, "Nueva partida" no parecía hacer nada y "Continuar" mostraba el juego superpuesto al menú. Se corrigió sacando el `display` del selector por ID (otra vez) y centrando `#menu-layout` con `position: absolute` + `transform` en su lugar, que no depende de que el padre sea flex. Quedó un comentario de advertencia en el CSS para que este error puntual no se repita una tercera vez.

---

2026-08-16 — temporizador por día (rama `dia-por-tiempo`):

Jugando la versión con temporizador por visitante, Mike propuso un cambio de ritmo: un solo temporizador para todo el día en vez de uno por visitante — mientras dure, entran visitantes sin parar, y el jugador decide qué tan rápido va (más rápido = más dinero, pero más riesgo de error). Antes de tocar código se armó un plan (ver el archivo de plan de la sesión) porque el cambio afecta la separación limpia que tiene `Game.ts` hoy (no sabe nada de tiempo real ni DOM, por diseño, para poder testearse sin navegador).

**Cómo quedó, en `Game.ts`:**
- `decide()` ya no revisa cuántos visitantes se vieron hoy para avanzar de día — ese bloque se sacó entero. Solo evalúa acierto/error y chequea derrota.
- Nuevo método público `endDay()` (contiene lo que antes vivía adentro de `decide()` para avanzar de día) — lo llama `main.ts` cuando se acaba el temporizador.
- El sorteo de "quién es problemático hoy" pasó de un array de tamaño fijo (pre-armado y barajado una sola vez, porque antes se sabía de antemano cuántos visitantes iba a haber) a una **probabilidad tirada de nuevo en cada visitante** — mismo cálculo de siempre (`Math.min(díaActual + 1, meta - 1) / meta`), solo que ahora la "meta" del día es el denominador de una proporción, no un tope real de visitantes.
- El dinero por acierto bajó de 10 a 2 (el de error se dejó en -5 a propósito, para que jugar rápido sea más arriesgado, no solo más lento — así no se descontrola la economía con muchos más visitantes por día).

**Cómo quedó, en `main.ts`:** el temporizador por visitante (con su "modo alerta" que lo achicaba a la mitad tras errores seguidos) se reemplazó por uno solo por día, que arranca cuando se entra a la pantalla de juego y no se reinicia entre visitantes. El modo alerta se sacó (no tenía un equivalente directo con un solo temporizador de día).

**`docs/test-temporal.mjs` necesitó una reescritura real, no solo volver a correrlo**: varios de los 8 tests asumían que `decide()` hacía avanzar los días solo. Los que recorrían la partida completa (perfecta hasta victoria, volumen de `specieLiar()`) ahora simulan el día llamando `endDay()` a mano, como haría `main.ts` real al vencer el temporizador. La auditoría de proporción de problemáticos por día pasó de comparar una cantidad exacta a una proporción con tolerancia sobre una muestra grande (150 visitantes simulados por día) — se corrió varias veces seguidas para confirmar que ningún día quedaba justo al límite de la tolerancia antes de darla por buena. Los tests que fuerzan derrota (2, 4, 6, 8) no dependían de la duración del día y no hizo falta tocarlos.

**Dos ajustes después de probarlo jugando:**

1. **Bug real: la Jefa cambiaba de golpe en la pantalla de resultado del día.** La causa era una condición de carrera nueva, consecuencia directa de que el temporizador ya no se cancela al decidir un visitante (antes sí, porque era por visitante) — si el temporizador del día vencía justo mientras se animaba una decisión (~2 segundos: sello, cierre del pasaporte, arco de vuelta, salida del personaje), se disparaban **dos caminos** hacia `afterDecision()` casi al mismo tiempo: el del propio temporizador, y el de la decisión que ya estaba en camino. Cada uno elegía una Jefa al azar para la pantalla de resultado, por eso se veía "cambiar de golpe" — y de paso, la decisión en curso podía terminar evaluándose contra el visitante equivocado (el que ya había generado el día siguiente). Se corrigió con dos variables de control (`resolviendoDecision`/`diaTerminaAlSoltar`): si el temporizador vence con una decisión en camino, no corta nada — espera a que esa decisión termine de procesar el visitante que el jugador realmente vio, y recién ahí cierra el día, una sola vez.

2. **La racha pasó a ser por día** (antes se acumulaba toda la partida): se reinicia en cada día nuevo. De paso, Mike pidió dejar preparado (sin usarlo todavía) el guardado de la racha con la que cerró cada día — pensando en una idea a futuro, un final alternativo si la racha de todos los días fue "perfecta". Se agregó `saveDayStreaks()`/`loadDayStreaks()` en `Storage.ts` (mismo patrón que el resto de las funciones de persistencia) y un array en `main.ts` (`rachasPorDia`) que se llena en cada cierre de día y se guarda en `localStorage` — "Nueva partida" lo vacía, "Continuar" lo recupera. La idea completa (con el umbral exacto y el final en sí) quedó anotada en `docs/ideas.md` para cuando haya arte y se termine de definir.
