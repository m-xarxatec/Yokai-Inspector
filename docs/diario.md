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

1. **Bug real: la Jefa cambiaba de golpe en la pantalla de resultado del día.** La causa era una condición de carrera nueva, consecuencia directa de que el temporizador ya no se cancela al decidir un visitante (antes sí, porque era por visitante) — si el temporizador del día vencía justo mientras se animaba una decisión (~2 segundos: sello, cierre del pasaporte, arco de vuelta, salida del personaje), se disparaban **dos caminos** hacia `afterDecision()` casi al mismo tiempo: el del propio temporizador, y el de la decisión que ya estaba en camino. Cada uno elegía una Jefa al azar para la pantalla de resultado, por eso se veía "cambiar de golpe" — y de paso, la decisión en curso podía terminar evaluándose contra el visitante equivocado (el que ya había generado el día siguiente). Se corrigió con dos variables de control (`resolvingDecision`/`dayEndsOnRelease`): si el temporizador vence con una decisión en camino, no corta nada — espera a que esa decisión termine de procesar el visitante que el jugador realmente vio, y recién ahí cierra el día, una sola vez.

2. **La racha pasó a ser por día** (antes se acumulaba toda la partida): se reinicia en cada día nuevo. De paso, Mike pidió dejar preparado (sin usarlo todavía) el guardado de la racha con la que cerró cada día — pensando en una idea a futuro, un final alternativo si la racha de todos los días fue "perfecta". Se agregó `saveDayStreaks()`/`loadDayStreaks()` en `Storage.ts` (mismo patrón que el resto de las funciones de persistencia) y un array en `main.ts` (`dayStreaks`) que se llena en cada cierre de día y se guarda en `localStorage` — "Nueva partida" lo vacía, "Continuar" lo recupera. La idea completa (con el umbral exacto y el final en sí) quedó anotada en `docs/ideas.md` para cuando haya arte y se termine de definir.

---

2026-08-16 (parte 2) — rediseño visual completo (misma rama `dia-por-tiempo`): fondo unificado, sellos drag-and-drop, reloj de arena:

Mike subió una tanda grande de arte nuevo (`fondoPantallaJuegoT.png`, `barraLateralIzq.png`, `barraDialogos.png`, `DesktopNew.png`, el directorio `sellos/` con 6 imágenes, y 9 cuadros de reloj en `animaciones/`) y pidió planear e implementar directo, sin pausar a preguntar — con margen explícito para ajustar después si algo no calzaba.

**Cómo quedó armado:** todo `#game-screen` pasó a vivir dentro de un único canvas (`#character-scene`, 3670×2446, igual que antes) con `fondoPantallaJuegoT.png` como fondo — HUD, moneda, reloj y diálogo dejaron de ser barras HTML aparte con su propio fondo sólido y pasaron a superponerse en % sobre ese mismo canvas. `window.png` (la ventanilla que iba delante del personaje) se dio de baja: el fondo nuevo ya trae su propia escena de ventanilla dibujada adentro, y Mike confirmó después que no hacía falta recuperarla. El escritorio (`desktop.png` → `DesktopNew.png`), la barra lateral y la de diálogo se posicionaron con `im.getbbox()` de PIL sobre cada imagen (no a ojo), para calzar exacto con el recuadro que el fondo ya dibuja en cada zona.

**Sellos reales, drag and drop de verdad** (reemplazan los botones Aceptar/Rechazar): 3 imágenes por color (reposo/arrastrando/estampando), con Pointer Events (`setupStampDrag()` en `main.ts`) — al soltar cerca del pasaporte dispara la decisión, en cualquier otro lugar vuelve solo a su posición inicial (nunca queda "tirado" en otro lado). Mantienen los ids `#accept-btn`/`#reject-btn` para no duplicar la lógica de habilitado/deshabilitado que ya existía; como dejaron de ser `<button>`, se armó `setDecisionStampsEnabled()` (aria-disabled + pointer-events, sin bajarle la opacidad — Mike pidió explícitamente que el arte se vea igual, deshabilitado o no) en vez de la propiedad `.disabled`.

**Reloj de arena** (reemplaza la barra de tiempo por día): 4 etapas repartidas en partes iguales del tiempo del día, cada una alternando 2 cuadros para dar sensación de movimiento (mismo criterio que la moneda girando), con reloj roto a partir de 3s o al vencer, y un parpadeo leve→fuerte si el reloj está roto y todavía hay una decisión en curso.

**Bug real, encontrado por Mike jugándolo:** `barraLateralIzq.png`/`barraDialogos.png`/`DesktopNew.png` se habían achicado a su propio `bbox` (con `background-size: 100% 100%` adentro de esa caja chica) — eso estira la imagen COMPLETA (margen transparente incluido) dentro de una caja mucho más chica que el canvas real, encogiendo y desplazando el arte en vez de calzarlo con el fondo. La medición con PIL servía para ubicar elementos HTML más chicos que el canvas (HUD, sellos, reloj), pero no para estas 3 imágenes de fondo, que son igual de grandes que `fondoPantallaJuegoT.png` y se superponen tal cual (`inset: 0`, igual que el fondo).

**Ronda larga de ajuste fino, todo a pedido de Mike jugándolo (sin que yo pudiera verlo — el navegador se lo probó siempre él):**
- La pantalla de juego entera pasó de una columna fija (`--game-max-width: 760px`) a ajustarse al viewport igual que el menú (`min(94vw, calc(90vh * 3670/2446))`, `#game-screen` con `position:fixed;inset:0` igual que `#menu-screen`).
- `#character-portrait` se achicó y recalibró varias veces: primero porque el personaje viejo (medido sobre `window.png`) quedaba tapado casi entero por el escritorio nuevo (que ahora ocupa menos alto que antes) y solo se le veía la cabeza; después Mike pidió que su base llegara más abajo dentro del escritorio (no apenas rozando el borde) y que quedara centrado en el escritorio, no en el fondo completo.
- La parábola del pasaporte (`PASSPORT_ARC_BASE`/`PASSPORT_ARC_DESK` en `main.ts`) se resincronizó dos veces con la posición real del personaje/escritorio: primero para que no aterrizara pisando la barra de diálogo (el escritorio nuevo no llega al 100% de alto como el viejo), después porque Mike pidió que el origen/destino fuera la base del personaje y no su rostro/centro — pero usar el borde inferior *geométrico* de `#character-portrait` (mayormente tapado por el escritorio) hacía que, al devolverse, el pasaporte se hundiera visiblemente detrás/debajo del escritorio. Se corrigió usando el punto real donde el personaje desaparece detrás del escritorio (el borde superior de `#scene-desktop`), no el borde de su caja.
- **Bug real, cuernos:** con el contenedor del personaje ya achicado, `.part-horns` (una capa posicionada a mano, "arriba de la cabeza", nunca medida con script) quedó flotando por encima de la cabeza real. La causa: `rostro-N.png` tiene su propio aspect ratio (500×806 ≈ 0.62) que antes calzaba casi exacto con la caja del personaje (0.62 también) — con la caja nueva, más angosta (aspect ≈0.34), `background-size: contain` ya no llena el contenedor: dejaba franjas vacías arriba y abajo (~22.8% del alto cada una) antes de que arrancara el dibujo real. Se recalculó la posición de los cuernos con la proporción real (no a ojo) para que siguieran cayendo sobre la cabeza pase lo que pase con el tamaño del contenedor.
- El reloj de arena y la moneda se agrandaron (tamaños fijos en `rem` → `clamp()` en `vw`, y el `height`% del reloj más grande) para no perderse en la escena mucho más grande. Los valores de DÍA/ERRORES/RACHA se recorrieron (más grandes, más a la derecha, RACHA más todavía) para caer después de las palabras ya dibujadas en el arte — la ubicación exacta de estos 3 quedó para que Mike la termine de afinar él mismo, jugando.
- Los sellos ganaron una sombra (`filter: drop-shadow`, sigue la silueta real del PNG) mientras están en reposo sobre el escritorio, y el diálogo de los visitantes pasó de recortarse en una sola línea forzada a poder bajar a una segunda línea si no entra (con `overflow:hidden` como red de seguridad, no como recorte normal).
- El "palpitar" que tienen `relojfull1.png`/`rejojfull2.png` de forma natural (un cuadro es ~1.3% más chico que el otro) le gustó a Mike, pero las otras 3 etapas no lo tenían en el arte original (cuadros idénticos). Se extendió el mismo efecto por CSS a las 4 etapas (`#day-clock.frame-b { height: 15.8%; }`) en vez de editar los PNG a mano, para no arriesgar una calibración despareja entre etapas.

---

2026-08-16 (parte 3) — limpieza final: assets sin usar y nombres en inglés (mismo `dia-por-tiempo`, antes de mergear):

Mike pidió, como última tanda antes de dar por cerrada la rama: (1) buscar y borrar del repo lo que no se esté usando (imágenes, directorios, placeholders), (2) pasar a inglés los nombres en español del código (variables, funciones, etc.), salvo lo que haga falta mantener en español, y (3) borrar la rama `dia-por-tiempo` una vez mergeada.

**Assets sin usar, revisados** (confirmado con un script que cruza cada archivo de `public/img/` contra referencias reales `url(...)`/`src=...` en `.html`/`.css`/`.ts`, sin contar comentarios ni menciones de texto): salieron 19 candidatos sin ninguna referencia real. De esos, se dieron de baja los que de verdad eran arte descartado: `backgrounds/desktop.png` y `backgrounds/window.png` (reemplazados esta misma rama por `DesktopNew.png`/`fondoPantallaJuegoT.png`), `backgrounds/fondoInicio2.png` y `backgrounds/FondoPanInicio.jpeg` (versiones viejas del fondo del menú, ya reemplazadas por `backgroundEnd.png`), y 4 SVG de prueba en `img/test/` (`eyes-test`, `face-test`, `hair-test`, `mouth-test` — de los 5 archivos de esa carpeta, solo `horns-test.svg` es arte real, usado como `.part-horns.variante-1`). De paso, `public/img/cuernos/` era un directorio vacío sin ninguna referencia — se borró también.

**Se restauraron** (avisó Mike después, con `git checkout HEAD -- <archivo>`, sin hacer falta traer nada de GitHub porque el borrado todavía no estaba commiteado): `documentos/monedaSuerte.png`, `documentos/promesa.png`, `documentos/volanteEspecial.png`, las 6 variantes de la Jefa que `JEFA_EXPLICA_VARIANTS` no usa todavía (`jefaAsustada`, `jefaDecepcion`, `jefaEnojo`, `jefaEnojo2`, `jefaNeutral`, `jefaPresentacion` — solo las 5 `jefaExplica-N` están cableadas por ahora), y las 2 variantes del protagonista que `#story-portrait` no usa todavía (`protaDepre`, `protaReprendido` — solo `protaFeliz.png` está en uso por ahora) — Mike los tiene guardados para integrarlos más adelante, no eran clutter real.

Ningún archivo de `public/data/*.json` ni ninguna clase de `src/ts/` quedó sin usar (se revisaron aparte). No se tocaron los directorios `originales/` (backups de los PNG sin recortar, ver sesiones anteriores) — esos son a propósito, no clutter.

**Nombres en español pasados a inglés**: `Character`/`Human`/`Yokai`/`Passport`/`Rule`/`Day`/`Storage.ts` ya venían en inglés casi del todo (la convención de `docs/convenciones.md`, "clases, campos y métodos en inglés", ya se venía respetando) — solo aparecieron 2 sueltos: `especieAparente` → `apparentSpecie` (`Yokai.specieLiar()`) y `opcionesDeMentira`/`especie` → `lieOptions`/`specie` (`Game#generateVisitor()`). El grueso estaba en `main.ts`, que nunca había pasado por esta revisión: unas 80 variables/parámetros/tipos locales (`visitante`→`visitor`, `pasaporte`→`passport`, `racha`→`streak`, `direccion`→`direction`, `facilitador`→`easing`, `ElementoDeslizable`→`SlidableElement`, etc.) y varios strings usados como nombre de estado interno en `classList`/CSS, actualizados en los dos lados a la vez para que sigan calzando: `"izquierda"/"derecha"`→`"left"/"right"`, `"cerrado"/"abierto"/"entregado"`→`"closed"/"open"/"delivered"`, `"mesa1/2/3"`→`"desk1/2/3"`, `"mostrar"/"aprobado"/"rechazado"`→`"show"/"approved"/"rejected"`, `"arrastrando"`→`"dragging"`, `"alerta"`→`"alert"`, y los 4 nombres de etapa del reloj de arena (`"roto"`→`"broken"`, `"stage-medio/casi/vacio"`→`"stage-half/almost/empty"`, `"pulso-leve/fuerte"`→`"pulse-light/strong"`, con sus `@keyframes` a tono). Se actualizó `docs/convenciones.md` para reflejar que esto ya no aplica solo a clases/campos/métodos.

**Lo que se dejó en español a propósito** (documentado en el `convenciones.md` actualizado): los VALORES y las CLAVES de esquema de los `.json` de `public/data/` (ej. `parts.rostro`/`parts.ojos`/`parts.boca`, o strings como `"humano"`/`"oni"`/`"victoria"`/`"derrota"` que el código compara tal cual) — cambiarlos implica tocar los archivos de datos, no solo el código; y los nombres de código atados 1 a 1 al nombre de un archivo de arte ya existente (`"jefa-scene"`/`"jefaExplica-N"` → `jefaExplica-N.png`, `.moneda-1` → `moneda-1.png`, `.stamp-rojo`/`.stamp-verde` → `selloRojo*.png`/`selloVerde*.png`) — renombrar el código sin renombrar el archivo real los dejaría desalineados. Los comentarios y todo el texto/diálogo visible para el jugador tampoco se tocaron: siguen en español, es el idioma de trabajo del equipo.

**Bug propio durante la limpieza #1, encontrado y corregido antes de terminar**: el primer intento de renombrar variables con `sed` (reemplazo directo por palabra completa en todo el archivo) también reemplazaba esas mismas palabras dentro de comentarios en prosa (`hasta`, `nombre`, `fila`, etc. son palabras españolas comunes, no solo nombres de variable) — por ejemplo un comentario que decía "...queda aplicado *hasta* que corre..." terminó diciendo "...queda aplicado *to* que corre...". Se revirtió y se rehizo con un script que primero separa comentarios/strings del código real, y solo aplica los renombres sobre el código — los comentarios quedaron intactos.

**Bug propio durante la limpieza #2, encontrado por Mike jugándolo DESPUÉS de dar el trabajo por terminado**: el pasaporte dejó de aparecer al entregarlo. Causa: al renombrar los strings de estado `"cerrado"/"abierto"/"entregado"/"mesa1-3"` → `"closed"/"open"/"delivered"/"desk1-3"` en `main.ts`, se actualizó el lado de `main.ts` pero se olvidó actualizar los selectores correspondientes en `style.css` (`#passport-object.cerrado`, `.abierto`, `.cerrado.mesa1/2/3`, `.cerrado.entregado`) — quedaron con los nombres viejos. `main.ts` le ponía la clase `"closed"` al elemento, pero como en el CSS solo existía la regla para `.cerrado`, el pasaporte se quedaba sin imagen ni posición (invisible del todo). Se corrigió renombrando esos mismos selectores en `style.css`, y de paso se armó un chequeo cruzado (cada string usado en `classList` de `main.ts` contra los selectores reales de `style.css`) para confirmar que no quedó ningún otro par desalineado del mismo tipo.

Verificado con `npm run build` + los 8 tests de `docs/test-temporal.mjs` después de cada tanda de cambios — todo en verde.

---

2026-08-16 (parte 4) — narrativa: intro del día 1, reacciones de la Jefa por error, 2 finales nuevos, cuernos reales (de nuevo en `dia-por-tiempo`):

Mike volvió a esta rama para una tanda de cambios más "estéticos"/de contenido, apoyada en varias imágenes nuevas que subió (variantes de la Jefa: `jefaPresentacion`, `jefaNeutral`, `jefaEnojo2`, `jefaDecepcion`, `jefaGolpea`, `jefaAsustada`, `jefaKatana`, `jefaTeAma`; `backgroundWin1.png`; y 4 diseños reales de cuernos en `public/img/cuernos/`, hasta ahora un directorio vacío).

**Intro del día 1, 3 cuadros con la Jefa**: se sacó la frase "sin inducción ni manual de bienvenida" del texto del detective (primera pantalla). Al hacer click en "Siguiente", en vez de ir directo al resumen del día (como en cualquier otro día), ahora se reproducen 3 cuadros con la Jefa (imagen + diálogo, uno por click en "Continuar"): bienvenida algo sarcástica → la regla de los cuernos, bien remarcada → advertencia final. Se implementó reutilizando `#day-result-screen` tal cual (mismo `#jefa-portrait`/`#next-day-message`/`#continue-day-btn` que ya usa el resumen entre días) en vez de armar una pantalla nueva — `#continue-day-btn` ahora revisa primero si hay una intro en curso (`introBeatIndex`) antes de decidir si arranca el juego.

**Reacciones de la Jefa por error (1º, 2º y 3º del día — el 4º ya termina la partida sola, no necesita reacción)**: cada error interrumpe el flujo normal (que iría directo al siguiente visitante) y muestra un cuadro con la Jefa reaccionando, con contenido distinto según si el error fue "dejar pasar a alguien que debía rechazar" o "rechazar a alguien que debía aceptar" — 6 combinaciones en total (`ERROR_REACTIONS` en `main.ts`). También reutiliza `#day-result-screen`; al continuar, vuelve al visitante siguiente SIN reiniciar el temporizador del día (sigue corriendo, igual que ya pasaba durante la animación de `resolveDecision()`). Mike aclaró que el dinero de estas reacciones se programa más adelante — por ahora es solo visual/narrativo, no cambia ninguna cuenta.

**2 finales nuevos, reemplazando el final de victoria genérico**: `renderFinalScreen()` se reescribió alrededor de un sistema de "cuadros" (`EndingBeat[]`, cada uno con su fondo + personaje opcional + texto) compartido por los 3 finales posibles:
- Derrota: sin cambios, 1 solo cuadro (`fondoPierdes.png`).
- Victoria con 2 o 3 errores ("regular"): 2 cuadros — `backgroundWin1.png` solo (ascenso a una oficina sin ventanas) y después el protagonista deprimido (`protaDepre.png`) sobre la oficina desenfocada.
- Victoria con 0 o 1 errores ("especial"): 1 cuadro — `jefaTeAma.png` sobre la oficina desenfocada.

`#final-scene` se reestructuró en 2 capas (`#final-backdrop`/`#final-portrait`, mismo criterio que `#jefa-background`/`#jefa-portrait`) para poder mostrar tanto una escena completa ya dibujada (`backgroundWin1`/`fondoPierdes`) como un personaje apoyado sobre la oficina desenfocada (`protaDepre`/`jefaTeAma`), según el cuadro. Se agregó `#final-continue-btn` ("Siguiente"), visible solo cuando el final tiene más de un cuadro — al terminarlos, se muestra "Volver al menú" como siempre.

**Cuernos reales**: reemplazan al placeholder que había (un triángulo CSS de color sólido, con un único SVG de prueba como única variante real). Las 4 imágenes nuevas se recortaron a su contenido real (mismo patrón que sellos/reloj de la ronda anterior — backups sin recortar en `public/img/cuernos/originales/`) y se renombraron de nombres genéricos de exportación (`Proyecto (fecha).png`) a `horns-1..4.png`. `partes.json` (`"cuernos"`) pasó de `["variante-1","variante-2","variante-3"]` a `["horns-1","horns-2","horns-3","horns-4"]`. Esto dejó sin uso el único SVG de prueba real (`horns-test.svg`) que quedaba en `img/test/` — se borró junto con el directorio (ya vacío).

**Bug real, encontrado por Mike jugando: los cuernos casi no se veían ("ni yo los alcanzo a identificar")**. Quedaron con el mismo 16% de ancho que tenía el placeholder viejo (un triángulo de color) — a simple vista parecía razonable reusar el valor, pero contra una caja de personaje ya angosta (18% del canvas, resultado de los ajustes de tamaño de la ronda visual anterior), ese 16% terminaba siendo ~2.9% del canvas COMPLETO: técnicamente se dibujaban, pero demasiado chico para reconocerlos como cuernos. Se verificó armando un composite con PIL (pegar `rostro-1.png` + cada `horns-N.png` con la misma matemática que usa el CSS, sin necesidad de abrir el navegador) para confirmar el tamaño real antes de tocar nada, y de paso se probó agrandando el recuadro por CSS (62% de ancho, ancla por `bottom` en vez de `top` para que las 4 variantes — con aspect-ratio bien distinto entre sí, de 1.36 a 7.23 — quedaran con el mismo borde inferior sin importar su altura real).

**Mike prefirió resolverlo por el lado del arte en vez de CSS**: va a agrandar el dibujo de `horns-1..4.png` directamente, así que se revirtió el cambio de tamaño/ancla (`.part-horns` volvió a `width:16%; top:26.06%; left:42%`, igual que había quedado en la parte 4) - la matemática de esa posición sigue siendo válida (calculada contra el margen real de `rostro-N.png`, no a ojo), solo cambia de dónde sale el tamaño visible: del arte en vez de un recuadro más grande.

**Aprendizaje de la ronda anterior, aplicado esta vez sin problemas**: cada clase nueva usada desde `main.ts` (variantes de `#jefa-portrait`, `#final-backdrop`/`#final-portrait`, `#part-horns`) se verificó cruzada contra los selectores reales de `style.css` ANTES de dar el trabajo por terminado — mismo chequeo que reveló el bug del pasaporte la vez pasada, esta vez para no repetirlo.

Verificado con `npm run build` + los 8 tests de `docs/test-temporal.mjs` — todo en verde (estos tests no ejercitan el flujo de pantallas nuevo, solo `Game.ts`/`Storage.ts`, que no se tocaron esta ronda).

---

2026-08-16 (parte 5) — el temporizador del día se pausa durante las reacciones de la Jefa por error:

Al principio, `showErrorReaction()` mostraba la reacción sin tocar el temporizador (seguía corriendo de fondo, igual que ya pasaba durante la animación de `resolveDecision()`) — a propósito, para no complicar la implementación inicial. Mike pidió que en vez de eso se pausara de verdad, para que leer la reacción no le robe tiempo de juego.

**Cómo quedó**: el modelo de un solo timestamp de inicio (`dayStartedAt`, desde el que se calculaba tanto el `setTimeout` que cierra el día como el reloj de arena visual) no alcanza para pausar — hace falta poder "congelar" el tiempo transcurrido y retomarlo después. Se reemplazó por dos variables: `dayElapsedMs` (tiempo real ya transcurrido del día, acumulado a través de pausas) y `dayResumedAt` (el instante en que arrancó el tramo que está corriendo ahora mismo, `null` si está pausado) — `currentDayElapsedMs()` suma ambos para saber el total real en cualquier momento. `pauseDayTimer()` cancela el `setTimeout` y el intervalo del reloj visual (que queda congelado en su último cuadro, no oculto) y guarda lo transcurrido; `resumeDayTimer()` retoma desde ahí, reprogramando el cierre del día con el tiempo que REALMENTE queda, no el día entero de nuevo. `startDayTimer()` (día nuevo) y `clearDayTimer()` (día termina de verdad) siguen reseteando todo desde cero, sin cambios de comportamiento ahí.

Se enganchó en los dos puntos que ya existían para esto: `showErrorReaction()` pausa antes de cambiar de pantalla, y la rama `errorReactionPending` de `#continue-day-btn` reanuda después de volver al visitante siguiente.

---

2026-08-16 (parte 6) — cuernos, segunda vuelta con arte más grande:

Mike redibujó los cuernos con más presencia (algunas de las 5 variantes que subió esta vez son notablemente más grandes dentro de su propio canvas que las de la ronda anterior, aunque no todas — dos de los cinco archivos coinciden en tamaño/posición con dos de los cuatro anteriores, parecen quedar igual a propósito). Se repitió el mismo proceso: recorte a contenido real con backup en `originales/` (se había perdido ese directorio junto con las imágenes viejas al revertir el intento anterior, se recreó), renombre de los nombres de exportación genéricos a `horns-1..5.png`, `partes.json` actualizado a 5 variantes (antes 4), y las reglas de `.part-horns.horns-N` en `style.css` con el `aspect-ratio` real de cada recorte nuevo.

El CSS de tamaño/posición (`width:16%`, ancla por `top`) se dejó tal cual había quedado revertido la vez pasada — Mike pidió resolver la visibilidad por el lado del arte, no agrandando el recuadro. Se verificó con el mismo composite de PIL de la ronda anterior (sin abrir el navegador): a ese tamaño, con el arte nuevo, los cuernos ya se distinguen con claridad.

---

2026-08-17 — se trae `actualIralys` de nuevo (fuente Jersey 10 + rótulo regla/error):

Mike pidió traer la rama de Iralys (`actualIralys`) para revisar novedades. Traía un solo commit nuevo desde la última vez (`feat:adicion de nueva fuente para mensaje de error de la Jefa`): una tipografía pixel-art más redondeada (`Jersey 10`, alojada localmente en `public/fonts/`, mismo criterio que el resto) para los párrafos largos que tipea la Jefa en `#next-day-message`, y un rótulo nuevo (`#notice-kicker`, "NUEVA REGLA" en dorado / "¡ERROR!" en rojo) que antes no existía — hasta ahora un cambio de regla y una reacción por error se veían visualmente idénticos en `#day-result-screen`, sin ninguna pista de cuál de los dos estaba pasando. Se agregó `setNoticeType()` en `main.ts`, llamada en los 3 puntos donde se renderiza el mensaje de la Jefa (intro del día 1, reacción por error, resumen entre días).

**Bug real, encontrado en la propia rama de Iralys antes de traer nada**: `docs/diario.md` tenía marcadores de conflicto de Git sin resolver (`<<<<<<<`/`=======`/`>>>>>>>`) commiteados tal cual al mergear `develop` — el bloque `HEAD` resultó ser una versión más corta de la misma entrada del 2026-08-14 que ya estaba más completa del otro lado del conflicto, así que se descartó el duplicado directamente en la rama `actualIralys` (commit aparte, sin tocar el resto).

**No se trajo todo, dos cosas se dejaron afuera a propósito**: la rama de Iralys todavía arrastra una referencia vieja a Google Fonts (`<link>` a `fonts.googleapis.com` para Jost/Marcellus en `index.html`, más `font-family: 'Jost'` en el selector universal `*` de `style.css`) — resto de una iteración temprana suya (commit `a49c9f3`), de antes de que se decidiera alojar las tipografías localmente para que el juego no dependa de internet (ver sesión del 2026-08-15, parte 2). En `objetosMike` esa referencia ya no existe, así que traer la rama tal cual la habría reintroducido; se dejó afuera. También se dejó afuera `Fondopersonaje.png` (imagen de referencia de cómo podría verse la pantalla de juego rediseñada, no arte para integrar directo) — mismo criterio que la sesión del 2026-08-14, sigue sin hacer falta en el repo.

Verificado con `npm run build` + los 8 tests de `docs/test-temporal.mjs` en `objetosMike` después de aplicar los cambios — todo en verde.

---

2026-08-17 (parte 2) — fuente unica (Jersey 10), tamaños escalados con cqw, y se saca la pista de las frases:

**Jersey 10 para todo, no solo el mensaje de la Jefa**: Mike pidió usar la tipografía nueva de Iralys en absolutamente todo el juego, no solo en `#next-day-message` (donde había entrado originalmente). Se simplificó el esquema de dos familias (`--font-display` con Press Start 2P primero, `--font-body` con Pixelify Sans primero) a que ambas variables empiecen con Jersey 10, dejando las anteriores como fallback. Como Jersey 10 dibuja más chico que Pixelify Sans al mismo `font-size`, se subió el tamaño en cascada por todo el juego: botones (genérico y `.menu-real-btn`), pasaporte, diálogo del visitante, y los diálogos de narrador (`#story-text` de la intro, `#final-message` de ganar/perder) que antes ni siquiera tenían un `font-size` propio.

**Bug real encontrado al subir esos tamaños, no relacionado con la fuente en sí**: varios de esos elementos (contadores DÍA/ERRORES/RACHA, diálogo del visitante, pasaporte, botones del menú) viven superpuestos en `%` sobre una caja de proporción fija (`#character-scene`/`#menu-layout`, dimensionadas con `min(80vw, 70vh × proporción)` o similar) pero su `font-size` estaba en `rem` fijo o en `vw` — unidades que NO seguían el tamaño real de esa caja. En cualquier pantalla ancha típica (16:9, 16:10) el término que gana en el `min()` es el de altura (`vh`), no el de ancho, así que un `font-size` en `vw` queda completamente desacoplado del tamaño real de la caja - se veía bien de pura casualidad en la proporción de pantalla donde se probó, y quedaba gigante (o de plano fijo, sin escalar nada) en cualquier otra. Esto se notó cuando Mike probó en una pantalla chica: el pasaporte, el diálogo y los botones del menú (que además con padding fijo llegaban a "comerse" la pantalla entera en una caja muy achicada) no se adaptaban en absoluto.

**La solución - container query units**: se declaró `container-type: inline-size` en `#character-scene` y `#menu-layout`, y el `font-size` (y el `padding` de `.menu-real-btn`) de todo lo que vive adentro se pasó a `cqw` (porcentaje del ancho REAL de esa caja puntual, no del viewport) - mismo criterio que ya usaban las posiciones en `%`, ahora aplicado también al tamaño de fuente. Afecta: `#day-counter`/`#error-counter`/`#streak-counter`, `#money-counter`, `#dialogue-bubble`, `#passport-page-left`, `.menu-real-btn` (con su padding). Se sacó el override de tamaño/padding que tenía `.menu-real-btn` en el `@media (max-width: 599px)` porque ya no hace falta - escala solo; se dejó el ajuste de posición/ancho de esa misma media query, que es una decisión de layout aparte. El tamaño del canvas en sí (el `min(80vw, 70vh×...)`) no se tocó - sigue siendo la decisión de una sesión anterior (no pasarse de 90-94% en un monitor grande).

**Se sacan las frases sospechosas**: a pedido de Mike, se elimina el mecanismo de pistas por diálogo (`public/data/frases_sospechosas.json`, con más chance de aparecer si el visitante era problemático) — de ahora en más todos los visitantes dicen una frase de humor negro cualquiera de `frases.json`, sin relación con si mienten o no. En `Game.ts`: se sacó el campo `#suspiciousPhrases`, su `fetch()`, y `#pickPhrase()` volvió a ser un simple sorteo sobre `#phrases` (antes tiraba una probabilidad -0.5 si problemático, 0.12 si no- para decidir entre las dos listas). Se borró `frases_sospechosas.json` del repo y se actualizó la mención en `docs/GDD.md`. La lista original (`frases.json`) se mantiene tal cual, a la espera de que Mike defina con qué la van a complementar más adelante.

Verificado con `npm run build` + los 8 tests de `docs/test-temporal.mjs` - todo en verde (ninguno de los 8 ejercitaba las frases sospechosas, son solo texto/flavor).

---

2026-08-19 — tanda grande de contenido: aliens y su sello azul (día 6), 3 finales nuevos, premios de fin de partida, personajes y cuernos nuevos:

Mike subió arte nuevo para cuatro frentes a la vez y pidió meterlo todo tocando lo mínimo posible y respetando `docs/convenciones.md`. Se trabajó en `objetosMike` (a mitad de la tanda avisó que no se tocara `develop`: el trabajo estaba empezado parado sobre `develop`, se movió a `objetosMike` con un `checkout` — ambas ramas estaban en el mismo commit, así que los cambios sin commitear pasaron enteros y `develop` quedó intacto).

**Personajes nuevos (24) + aliens (8)**: los 24 llegaron como exportaciones sin nombrar (`Proyecto (fecha).png`, más `charact`/`charrac`) en 1820×2934 — misma proporción exacta que los `rostro-N` existentes (500/806), así que solo hubo que redimensionar, sin recortar: pasaron a ser `rostro-25..rostro-48`. Los 8 aliens conservan su nombre (`alien1..alien8`), como pidió Mike, y viven en un pool aparte en `partes.json` (`"alienes"`), no mezclados con `rostro`.

**Los aliens y su pasaporte fijo**: cuando sale un alien, su pasaporte SIEMPRE declara región "vía láctea" y especie "alien". Eso obligó a una decisión de diseño: un alien no puede usarse para fabricar un visitante problemático generado por `region` (necesitaría declarar "rio") ni por `especieProhibida` (necesitaría una palabra de la lista negra), porque su pasaporte fijo pisaría justo el rasgo que lo volvía problemático y quedaría limpio — rompiendo `problematicRatio`, que no contempla eso. Con cuernos, ojos amarillos o sello prohibido no hay conflicto (el rasgo vive fuera del pasaporte, o en el sello, que no se toca), así que ahí sí pueden salir. Para saber si un visitante es alien se mira el ROSTRO (`Character.isAlien()`, los archivos se llaman `alienN`), nunca la especie declarada: "alien" ya estaba en `species.json`, así que cualquier Yokai puede declararla al mentir sin serlo.

**Regla nueva del día 6 (el hueco que faltaba)**: hasta ahora el día 6 no estrenaba ninguna regla (`dias.json` lo decía explícitamente). Ahora estrena la del sello azul: a un alien en regla ya no alcanza con dejarlo pasar, hay que aprobarlo con el **sello azul** en vez del verde de siempre, y el azul no vale para nadie más. Es la primera regla del juego que no dice A QUIÉN rechazar sino CÓMO aprobar, así que `Rule.isViolated()` devuelve `false` para ella a propósito (queda documentado ahí y en `reglas.json`): vive igual en los datos para activarse el día que corresponde, aparecer en la lista de reglas activas y traer su descripción. Dos ajustes que esto obligó, ambos reales: `#generateVisitor()` la excluye al elegir qué categoría usar para fabricar un problemático (si la elegía, salía un visitante sin nada que violar contado como problemático igual), y `decide()` pasó a recibir un segundo parámetro opcional `usedAlienStamp` — opcional para no romper a nadie que llame `decide(accept)` a secas.

**El sello azul en el escritorio**: tercer sello arrastrable (`selloAzul1/2/3.png`, mismas 3 posiciones que rojo y verde), a la izquierda de los otros dos para no mover los que Mike ya había ajustado. Solo aparece el día en que la regla empieza a regir. Lo que estampa sobre el pasaporte es `documentos/selloAliens.png`, misma familia que `selloAceptado`/`selloRechazado`.

**3 finales nuevos**, sobre el sistema de "cuadros" que ya existía (`EndingBeat`), sin inventar maquinaria nueva:
- `finalConvertidoYokai` — al perder 3 partidas SEGUIDAS (las dos primeras derrotas muestran el final normal).
- `finalEresJefe` → `finaljefapreocupada` (2 cuadros) — al ganar 3 partidas seguidas.
- `finalJefaMillonaria` — al ganar con mucho dinero. **PENDIENTE**: el umbral (`RICH_BOSS_MONEY` en `main.ts`) está en 9999 a propósito, una cifra absurda para que no salga por accidente hasta que Mike decida el número real (una partida normal de 7 días ronda las 100-200 monedas; el test de partida perfecta llegó a 2110 exprimiendo 150 visitantes por día).
- Orden de prioridad, de más raro a más común: 3 seguidas → dinero → errores → regular.

Para las rachas de partidas seguidas se agregó `addResultToStreak()`/`getResultStreak()` en `Storage.ts` (ojo, no confundir con `saveDayStreaks`, que es la racha de aciertos DENTRO de una partida). Lo registra `Game` al guardar el resultado en el historial, así que cuando `main.ts` elige el final la racha ya viene actualizada con esa partida.

**Premios de fin de partida**: se muestran de a uno después del final, gane o pierda, reusando los mismos cuadros y el mismo botón "Siguiente". `Game` acumula lo mínimo para decidirlos (a quién dejó pasar el jugador alguna vez, y su día con más visitantes atendidos) y `main.ts` arma la lista. Los tres de "no se te pasó ninguno" piden además haber llegado al día en que esa criatura empieza a aparecer (Oni día 1, Kitsune día 2, Kappa día 3): sin eso los ganaría de arriba cualquiera que pierda el primer día, porque nunca vio uno.

**Cuernos, tercera vuelta**: los 3 diseños nuevos reemplazan a los 2 que habían quedado. Se mantuvo el tamaño/posición que Mike ya había afinado a mano (`width:22%`, `top:32%`, `left:38%`), solo cambia el `aspect-ratio` de cada uno según su recorte real.

**El test encontró un problema real**: con la regla nueva, "jugar perfecto" dejó de ser solo aceptar/rechazar bien — a un alien limpio hay que aprobarlo con el azul. El TEST 1 (partida perfecta hasta la victoria) empezó a perder en el día 6 acumulando errores en cada alien, y el ratio de problemáticos de ese día se leía mal (0.57 en vez de 0.88) porque el bucle cortaba antes de los 150 visitantes pero el denominador seguía fijo. Se corrigió el test, no el juego. Se agregaron además dos tests nuevos: TEST 9 (el azul solo desde el día 6, solo para aliens, y el pasaporte de alien siempre "vía láctea"/"alien" — 43 aliens auditados) y TEST 10 (los datos de los premios). Los 10 tests pasan.

**Dos bugs propios encontrados por Mike al probarlo, los dos de alineación:**

1. **Los rostros nuevos salían ~15% más abajo que los viejos** ("alien7, rostro46, rostro32... muy abajo, no cuadra"), así que los ojos y la boca (que son capas de lienzo completo, dibujadas para una plantilla fija) caían sobre la frente o el pelo en vez de sobre la cara. La causa: al importarlos solo los redimensioné (1820×2934 → 500×806, misma proporción exacta) sin mirar DÓNDE cae el dibujo dentro del lienzo — los viejos dejan margen vacío abajo y los nuevos llegan hasta el borde inferior. Se corrigió midiendo, en cada imagen, la banda lisa y opaca del centro (la cara viene en blanco en estas plantillas, así que es la zona sin bordes) y desplazando cada rostro para que ese centro caiga donde lo tienen los 24 viejos. Se hace regenerando desde `originales/`, no desplazando el archivo ya procesado, para que se pueda volver a correr sin desplazar dos veces. La medición por imagen se ganó su lugar: 4 de los 24 nuevos ya venían con el encuadre viejo y recibieron un ajuste mínimo (7-44px) mientras el resto necesitó ~150px; un desplazamiento único los habría roto.

2. **Los cuernos caían sobre los ojos.** No era la posición heredada sino el arte nuevo: los 3 diseños tienen proporciones muy distintas entre sí (1.06, 1.60, 2.65) y, con el ancho fijo en 22%, cada uno sale con una altura distinta — anclados por `top`, los más altos colgaban hacia abajo. Se pasó a anclar por `bottom` (72%), así los tres apoyan el arranque del cuerno en el mismo punto de la cabeza midan lo que midan. `width`/`left` quedaron como Mike los había ajustado. (Es el mismo cambio de ancla que se había probado y revertido una ronda antes, cuando la solución fue por el lado del arte; con estas proporciones tan dispares ahora sí hace falta.)

Ambas correcciones se verificaron componiendo las imágenes con la misma matemática que aplica el CSS (rostro con `contain` dentro de la caja de `#character-portrait`, más ojos, boca y cuernos encima) y mirando el resultado, sin abrir el navegador.

**Segunda pasada de alineación, con un método mejor.** El arreglo de arriba dejaba varios rostros todavía desalineados y, peor, cortaba contenido arriba (los cuernos de `rostro-25`, los ojos de `alien7`) porque subía sin límite. Se reemplazó el proxy anterior (centro de la zona lisa) por optimizar directamente LO QUE IMPORTA: se toman los píxeles opacos de las capas de ojos y boca y se busca, para cada rostro, el desplazamiento vertical que hace caer la mayor cantidad de esos píxeles sobre zona lisa y opaca del rostro — es decir, sobre la cara en blanco. Validado primero contra los 24 rostros viejos: el óptimo cae dentro de ±15px de cero, o sea que el método coincide con el encuadre bueno. Se le agregó un tope duro para no cortar nunca el dibujo por arriba. Cuatro rostros (`rostro-27`, `rostro-40`, `rostro-47`, `alien2`) no llegaban a alinearse sin cortar: para esos se aplica lo que sugirió Mike — se achica el dibujo un 6% en vez de recortarlo, y así la cara sube lo que falta. `alien7` además lleva un retoque manual de 6px a la derecha (hay una tabla `RETOQUES` para este tipo de ajuste fino por rostro).

**Los cuernos caían sobre los ojos**, y no era la posición heredada sino el arte nuevo: los 3 diseños tienen proporciones muy distintas entre sí (1.06, 1.60, 2.65) y, con el ancho fijo en 22%, cada uno sale con una altura distinta — anclados por `top`, los más altos colgaban hacia abajo. Se pasó a anclar por `bottom` (72%): así los tres apoyan el arranque del cuerno en el mismo punto de la cabeza midan lo que midan. `width`/`left` quedaron como los tenía ajustados Mike. (Es el mismo cambio de ancla que se probó y se revirtió una ronda antes, cuando la solución fue por el lado del arte; con estas proporciones tan dispares ahora sí hace falta.)

**Otros ajustes de la misma tanda:**
- El sello azul del escritorio se veía más chico que el rojo y el verde: es de proporción más angosta, así que a la misma altura ocupaba menos ancho. Se le dieron alturas propias (14.5/16.5/18.5% en vez de 13/15/17%) hasta que los tres ocupan un ancho parecido.
- Los premios se muestran más chicos (66% → 42% de alto), con un brillo que late alrededor (mismo criterio que el pulso del pasaporte esperando click) y un giro corto que arranca al aparecer y se repite cada 3 segundos. `renderEndingBeat()` reinicia las animaciones en cada premio (truco de reflow) para que el giro coincida con la entrada de ese premio y no siga la fase del anterior.
- El final de convertirse en yokai ahora tiene un segundo cuadro que le avisa al jugador que se borra todo, y lo borra de verdad: `clearSavedGames()` en `Storage.ts` limpia historial, partida en curso y las dos rachas. NO toca los créditos acumulados por jugador, que son un ranking aparte y no una "partida guardada" — queda a confirmar si Mike los quiere incluir. Borrar también la racha de resultados es a propósito: deja el contador en cero para que el final no se repita en la derrota siguiente.
- Los ojos y la boca ahora hacen el mismo meneo idle que el cuerpo pero apenas más lento (2.9s contra 2.6s; el primer intento fue 3.9s y Mike pidió acercarlo — con esa diferencia la cara se despegaba demasiado y se leía como dos capas sueltas, mientras que 0.3s de diferencia hace que los ciclos se corran de a poco y vuelvan a juntarse). Como son hijos de `#character-portrait`, su movimiento se SUMA al del padre y la cara queda flotando apenas desfasada del cuerpo en vez de moverse pegada; por eso alcanza con la mitad del recorrido.

**Nota sobre el TEST 1**: en una de ~80 corridas dio un fallo suelto en el ratio de problemáticos. Se midió la distribución sobre 25 corridas × 7 días y está centrada en el valor esperado en todos los días (peor desvío observado 0.087 contra una tolerancia de 0.12), así que no es un bug de generación sino la tolerancia estadística del propio test en los días de ratio bajo (±0.12 sobre 150 visitantes son ~3 sigma, ~1% de falso positivo por corrida). Se deja como está para no debilitar el chequeo.

**Sin usar todavía**: `animaciones/maldicion.png` entró en la tanda pero Mike no dijo para qué es, así que quedó en el repo sin referenciar, esperando definición.

Verificado con `npm run build`, los 10 tests, y un chequeo cruzado automático de que toda imagen referenciada desde el CSS existe, toda entrada de `partes.json` tiene archivo Y regla CSS, y toda clase/id nuevo que usa `main.ts` tiene su selector real — el mismo chequeo que la vez pasada destapó el bug del pasaporte invisible.

---

2026-08-22 (Iralys, rama `actualIralys`) — sonido completo del juego, opciones nuevas, y merge grande con `develop`:

Sesión larga centrada en terminarle el sonido al juego (hasta ahora solo tenía el sello de aceptar/rechazar y el error), agregar opciones que Iralys venía pensando, y por último traer todo lo nuevo de `develop` (aliens, sello azul, los 3 finales nuevos) a esta rama sin perder nada de lo hecho acá.

**Sonidos nuevos, todos colgando de `SoundManager`**: `nextButton` (todo botón de navegación/continuar del juego, salvo los sellos de aceptar/rechazar, que ya tenían el suyo propio), `paperFlip` (al abrir el pasaporte), `nextPlease` (llama al primer pasajero de cada partida/día, y se repite después de cada sello correcto — no de uno incorrecto, ahí no tiene sentido "que pase el siguiente"), `victorySound`/`loseSound` (pantalla final), y `write` (mientras la Jefa reacciona a un error). Un ajuste chico sobre la marcha: si el error que se acaba de cometer es el que hace perder la partida, ya no suena el error (`playWrong`) — suena directo el de derrota, para no superponer los dos.

**Bug real, no solo de gusto**: varios sonidos (incluidos los que ya existían, aceptar/rechazar/error) reutilizaban un único `Audio` y llamaban `.play()` sin manejar la promesa. Al clickear rápido, una segunda llamada interrumpía a la primera (`AbortError`) y, al no estar capturado el error, el sonido se perdía en silencio — de ahí que "a veces sonara y a veces no". Se corrigió clonando el audio en cada reproducción (`#playClone()`, un único método privado por el que pasan todos los efectos) y capturando el error de `.play()`, así una reproducción interrumpida no le pisa el sonido a otra.

**La música del menú ahora acompaña toda la introducción**: antes se cortaba (`musicManager.stop()`) apenas se cambiaba de pantalla, incluso cuando la pantalla nueva era otro paso de la misma introducción. Se corrigió `changeState()` para que la música siga sonando sin cortes desde el menú hasta que la Jefa termina de explicar las reglas del día 1 (pasa por nombre del jugador, bienvenida, y los cuadros de la intro), y recién ahí se corta al arrancar el juego de verdad. De paso se encontró y corrigió el motivo real por el que a veces ni sonaba: en dos de los tres lugares que la disparaban, el código llamaba a `changeState()` (que corta música si la pantalla nueva no es de las que la mantienen) DESPUÉS de haber arrancado la música — se invirtió el orden.

**Bug grave encontrado en medio de todo esto**: el JavaScript compilado en `public/js/` no se había vuelto a generar desde el 19 de agosto — ninguno de los cambios de sonido de la sesión estaba llegando de verdad al navegador, así que probar el juego solo mostraba código viejo. Se corrigió corriendo `npm run build` y quedó como práctica para el resto de la sesión: recompilar después de cada cambio, antes de dar nada por probado.

**Pantalla de Opciones, dos botones nuevos** (mismo estilo que ya tenía `#timer-toggle-btn`, sin clase aparte): "Sonido: ON/OFF" silencia TODA la música y los efectos, incluidos los que se reproduzcan después — usa una variable booleana central en `SoundManager`/`MusicManager` en vez de la propiedad `muted` de cada `Audio`, porque como los efectos se clonan en cada reproducción, ese `muted` no viaja al clon. "Pantalla completa" usa la Fullscreen API nativa sobre `document.body` (no hay un contenedor `#app` aparte). Ajuste chico encontrado al probarlo: el navegador pinta un fondo negro propio (`::backdrop`) detrás del elemento en pantalla completa — se forzó al mismo fondo del `body` para que no cambie de color al activarla.

**Otro bug real, con el mismo síntoma en varias pantallas**: al arrastrar un sello, el navegador arrancaba una selección de texto nativa (no había `user-select: none` en `#game-screen`), lo que hacía aparecer un cursor de texto parpadeando de fondo. Se corrigió agregando `user-select: none` a `#game-screen`, que se hereda a todo lo de adentro (escena, pasaporte, sellos).

**Merge grande de `develop` a `actualIralys`**, con conflictos en varios archivos:
- `docs/diario.md` tenía marcadores de conflicto de un merge viejo commiteados como texto literal (el mismo bug ya documentado en la entrada del 2026-08-17) — se confirmó comparando los 3 lados del merge que el lado de `actualIralys` no aportaba nada real más allá de esa basura, así que se resolvió tomando el contenido de `develop` completo.
- `SoundManager.ts`/`main.ts` tenían conflictos reales de código: se combinaron a mano, quedándose con lo mejor de cada lado en cada bloque — el `SoundManager` completo de esta rama (ya incluía todo lo que traía `develop`), el `resolveDecision(accept, usedAlienStamp)` de `develop` (necesario para el sello azul del día 6, se habría roto en silencio si se tomaba la versión vieja), y los 6 finales combinados con las llamadas a `playLose()`/`playVictory()` de esta rama en cada rama correspondiente.
- Verificado con `npm run build`, los 10 tests, y una partida jugada de punta a punta en el navegador (Playwright) sin errores de consola.

**Umbral del final "Jefa Millonaria"**: `RICH_BOSS_MONEY` pasó del `9999` (placeholder absurdo a propósito, ver entrada del 2026-08-19) a **300** — por encima de lo que deja una partida normal de 7 días (100-200 monedas), pero alcanzable jugando rápido y arriesgado de verdad, sin requerir un ritmo imposible a mano.

---

2026-08-23 (Iralys) — documento de especificaciones del sistema económico:

Se usó el agente `.opencode/agents/generar-specs-economia.md` para auditar qué tan armado está el sistema de dinero del juego antes de seguir extendiéndolo, sin escribir código todavía. Resultado guardado en `especificaciones-economia.md` (raíz del repo).

**Lo que ya existía, sin que estuviera documentado en un solo lugar**: `#money` en `Game.ts` arranca en 10, suma 2 por decisión correcta y resta 5 por decisión incorrecta (`decide()`), se persiste en la partida guardada y en el historial, y se acumula entre partidas como ranking (`addCredits()`, pantalla de Créditos). El único uso real del dinero hoy, aparte de mostrarlo en el HUD, es disparar el final "Jefa Millonaria" al llegar a `RICH_BOSS_MONEY` (300). No hay cobro diario (renta) ni penalización de dinero por errores de procedimiento (dejar pasar a alguien peligroso sin que viole una regla activa todavía) — ninguno de los dos existe en el código.

**Propuestas nuevas que quedaron documentadas** (no implementadas): cobro diario fijo a partir del día 2, escalado con la cantidad de reglas activas del día (`2 + reglasActivas.length`); penalización chica por error de procedimiento sin sumar a `#errors`; y tres usos nuevos para gastar el dinero durante la partida (pista sobre la regla del día, tiempo extra en el reloj de arena, "seguro" contra el próximo error).

**Decisiones ya tomadas para cuando se implemente**: el cobro diario puede dejar `#money` en negativo sin que eso sea una derrota nueva — la única condición de derrota sigue siendo `#errors >= #maxErrors`; las compras nuevas (pista/tiempo/seguro) irían en un botón nuevo del HUD junto al de pausa, no en Opciones; `RICH_BOSS_MONEY` se mantiene en 300 por ahora, a confirmar con playtesting una vez que el cobro diario esté implementado de verdad; y la pantalla de resumen de día (`#day-summary-screen`) mostraría el cobro diario como línea aparte del dinero ganado por decisiones.

---

2026-08-23 (parte 2) — se implementa el cobro diario:

Primera pieza del documento de especificaciones que pasa de propuesta a código: el cobro diario (gastos fijos de vivir el día).

**Dónde vive**: método privado nuevo `Game.#chargeDailyCost()`, con dos campos nuevos, `#dayCharge` (cobro del día en curso) y `#lastDayCharge` (foto congelada del día que se acaba de cerrar, mismo patrón que ya existía con `#dayMoney`/`#lastDayMoney`). Se decidió llamarlo únicamente desde `endDay()` (después de sumar 1 a `#dayNumber` y de confirmar que no se ganó la partida, antes de `#startDay()`) y NO desde `#startDay()` directamente — `#startDay()` también lo llama `loadProgress()` cada vez que se recarga la página a mitad de partida, y cobrar ahí habría cobrado de nuevo el mismo día cada vez que el jugador refrescara el navegador. Como consecuencia natural de este diseño, el día 1 nunca cobra (arranca por `startNewGame()`, que nunca pasa por `endDay()`).

**El monto escala con la dificultad real del día**, no con el número que aparenta tener en `dias.json`: `costoDiario = 2 + Day.getActiveRules().length`. Al implementarlo se encontró que ese conteo real es más alto de lo que se había estimado a mano en el documento de especificaciones — `especieProhibida` expande a 4 reglas separadas desde el día 4 (kitsune/oni/kappa/poseído), así que la cantidad de reglas activas salta de 3 a 7 ese día, no de 3 a 4 como parecía leyendo solo el array `reglasActivas` de `dias.json`. Números reales por día (1 a 7): 1, 2, 3, 7, 8, 9, 10 reglas → cobro de 4, 5, 9, 10, 11 y 12 en los días 2 a 7 (51 en total en una partida completa, no ~39 como se había estimado). Se corrigió el documento de especificaciones con los números reales.

**Se muestra en la pantalla de resumen de día** (`#day-summary-screen`, `main.ts`): línea nueva "Cobro diario: -N", oculta si `game.lastDayCharge` es 0 (día 1).

**Test 11 nuevo** en `docs/test-temporal.mjs`: confirma que el día 1 no cobra, que el monto coincide con `2 + reglas activas` del día 2, y que forzar el dinero a negativo (con solo 3 errores, sin llegar a los 4 que pierden la partida) más el cobro diario deja el dinero todavía más negativo sin que `isLost()` se active — la decisión de que quedar en negativo no es motivo de derrota, tal como se había definido en la sesión anterior.

Verificado con `npm run build` + los 31 tests de `docs/test-temporal.mjs` (26 anteriores + 5 nuevos) — todo en verde. No se probó en el navegador todavía.

---

2026-08-23 (parte 3) — se implementa la penalización por decidir sin revisar el pasaporte:

Segunda pieza del documento de especificaciones. Antes de escribir nada se revisaron las dos ideas originales de "error de procedimiento" (dejar pasar un visitante peligroso sin regla activa, o exceder el tiempo sin decidir) y las dos se descartaron por no aplicar al código real: la primera no puede pasar nunca (`#generateVisitor()` solo pone cuernos/ojos amarillos cuando la regla ya está activa, así que siempre cae en el -5 normal de `decide()`), y la segunda penalizaría a todo el mundo al final de cada día por igual, porque siempre queda un visitante nuevo sin decidir cuando suena el timer (se genera uno apenas se decide el anterior) — no depende de ninguna acción evitable del jugador.

**Idea nueva, decidida con Iralys**: penalizar decidir demasiado rápido como para haber revisado el pasaporte de verdad, sin importar si la decisión en sí fue correcta.

**Dónde se mide el tiempo**: no en el momento en que se llama a `Game.decide()` dentro de `resolveDecision()` (main.ts) — esa llamada está atrás de ~2 segundos de animación del sello y el pasaporte, no refleja cuánto tardó el jugador de verdad. Se mide en cambio desde `setDecisionStampsEnabled(true)` (el click de `#passport-object`, cuando se habilita decidir) hasta el instante en que se invoca `resolveDecision()` (cuando el jugador suelta el sello) — variable nueva `passportOpenedAt` en `main.ts`, umbral `RUSH_THRESHOLD_MS = 700`.

**Dónde vive en `Game.ts`**: `decide()` suma un tercer parámetro opcional, `wasRushed` (default `false`, para no romper las llamadas de 2 argumentos que ya existían en tests y en el resto del código). Resta `RUSH_PENALTY = 1` de `#money` de forma independiente al acierto/error de la decisión — nunca suma a `#errors`, es un descuido de procedimiento, no un error de reglas. Mismo patrón día/lastDay que `#dayMoney`/`#dayCharge`: campos nuevos `#dayRushPenalty`/`#lastDayRushPenalty`, con línea nueva ("Descuido (decidiste sin revisar): -N") en `#day-summary-screen`, oculta si no hubo ninguna decisión apurada ese día.

**Test 12 nuevo** en `docs/test-temporal.mjs`: un acierto apurado resta el `+2` normal más el `RUSH_PENALTY` sin tocar `#errors`; una decisión sin apurar (llamando a `decide()` con dos argumentos, como el resto del código viejo) no resta nada de más.

Verificado con `npm run build` + los 35 tests de `docs/test-temporal.mjs` (31 anteriores + 4 nuevos) — todo en verde. No se probó en el navegador todavía (falta confirmar que el umbral de 700ms se siente bien jugando de verdad, no solo en los tests).

---

2026-08-23 (parte 4) — arranca la tienda: botón nuevo en el HUD y la primera compra (pista):

Tercera pieza del documento de especificaciones. Antes de escribir código se definieron los 3 precios con Iralys: pista 3 (revisar pasaporte), tiempo extra 5 (+15s), indulto 8 (el más caro, puede salvar la partida). Esta sesión implementa la infraestructura de la tienda entera más la primera compra; tiempo extra e indulto quedan para las próximas dos.

**HUD**: botón nuevo `#shop-btn` ("$"), a la izquierda del de pausa (`right: 6.5%` en `style.css`, mismo estilo que `.exit-to-menu-btn`). Reutiliza esa clase para el aspecto visual pero **no** el comportamiento — se agregó a la exclusión del handler compartido (`.exit-to-menu-btn:not(#pause-btn):not(#shop-btn)`) para que no mande al menú como el resto de esos botones. Abrir la tienda pausa el día entero (mismas `pauseDayTimer()`/`resumeDayTimer()` que ya usaba la pausa), igual criterio que Opciones.

**Pantalla nueva `#shop-screen`**: mismo patrón `.screen-panel` que Pausa/Opciones/Créditos, con el dinero disponible arriba y un botón por compra (se van a ir agregando).

**Pista (`Game.ts#buyHint()`)**: devuelve la propiedad de la regla que el visitante actual está violando (`Rule.getProperty()`, vía `currentDay.evaluateCharacter()`), o `null` si está limpio — en ese caso no hay nada que revelar, pero el costo se cobra igual, es el riesgo de comprarla "a ciegas". También devuelve `null` sin cobrar si no alcanza el dinero (la UI ya deshabilita el botón en ese caso; esto es solo una segunda barrera del lado de `Game`).

**De la propiedad al resaltado visual**: función nueva `hintTargetSelector()` en `main.ts` traduce la propiedad devuelta al elemento a resaltar — los rasgos físicos (`tieneCuernos`/`ojosAmarillos`) se ven en el personaje (`.part-horns`/`.part-eyes`), el resto (`region`/`especieProhibida`/`sello`) en el campo correspondiente del pasaporte. Clase CSS nueva `.hint-highlight` (glow dorado, `@keyframes hint-glow`, se saca sola a los 2.5s). Se limpia cualquier resaltado que hubiera quedado colgado al renderizar el visitante siguiente (`renderVisitor()`), por si el jugador decide antes de que termine de apagarse.

**Test 13 nuevo** en `docs/test-temporal.mjs`: confirma que la pista devuelve la propiedad correcta sobre un visitante sucio, que cobra igual sobre uno limpio sin devolver nada, y que no cobra nada si no alcanza el dinero. Encontró y corrigió un problema del propio test (no del código): `partidaEnDia(4)` decide sobre un solo visitante por día para llegar rápido al día 4, así que el cobro diario acumulado (4+5+9=18) puede dejar el dinero en negativo antes de probar la pista — se agregaron decisiones de más antes de buscar al visitante de prueba, para no confundir "no alcanza el dinero" con un fallo real de `buyHint()`.

Verificado con `npm run build` + los 40 tests de `docs/test-temporal.mjs` (35 anteriores + 5 nuevos) — todo en verde. No se probó en el navegador todavía.

---

2026-08-23 (parte 5) — segunda compra de la tienda: tiempo extra:

**`Game.ts#buyExtraTime()`**: cobra `EXTRA_TIME_COST = 5` y devuelve `true`/`false` según si se pudo comprar - `false` tanto si no alcanza el dinero como si ya se usó el tiempo extra ese día (`#usedExtraTimeToday`, se resetea en `#startDay()`, igual que los demás contadores del día en curso). Los segundos que suma quedan del lado de `main.ts` (`EXTRA_TIME_MS = 15000`) — `Game.ts` no sabe nada de timers, solo controla el dinero y el límite.

**Cómo se suman los 15 segundos sin tocar el timer directamente**: la tienda ya se abre con el día pausado (`pauseDayTimer()`, igual que Opciones). Mientras está pausado, `dayElapsedMs` guarda cuánto tiempo real ya pasó — restarle `EXTRA_TIME_MS` a esa variable equivale a sumarle tiempo al reloj, sin necesidad de tocar `dayTimeoutId` a mano: `resumeDayTimer()` (al cerrar la tienda) ya recalcula el tiempo restante a partir de `dayElapsedMs` y reprograma el cierre del día con el valor correcto.

**Test 14 nuevo** en `docs/test-temporal.mjs`: la primera compra del día cobra y funciona, la segunda se niega sin cobrar de más, el límite se resetea al día siguiente, y sin dinero suficiente tampoco cobra. Mismo cuidado que el test 13: hubo que agregar decisiones de más antes de probar la compra en el día siguiente, porque el cobro diario ya había dejado el dinero por debajo del costo.

Verificado con `npm run build` + los 45 tests de `docs/test-temporal.mjs` (40 anteriores + 5 nuevos) — todo en verde. No se probó en el navegador todavía.

---

2026-08-23 (parte 6) — tercera y última compra de la tienda: el indulto, y la tienda queda completa:

**`Game.ts#buyInsurance()`**: cobra `INSURANCE_COST = 8` (la más cara de las 3) y activa `#hasInsurance`. No se puede comprar un segundo indulto mientras el primero sigue activo — `buyInsurance()` devuelve `false` sin cobrar en ese caso. Se resetea a `false` en `#startDay()`: si no se usó en el día, no pasa al siguiente.

**Cómo se consume en `decide()`**: en la rama de decisión incorrecta, si `#hasInsurance` está activo se lo apaga (`this.#hasInsurance = false`) en vez de sumar a `#errors`/`#dayErrors` — pero el `-5` de dinero de esa decisión se sigue restando igual. No es "gratis equivocarse", es "no te cuesta la partida". Con esto, la sección "compras nuevas" del documento de especificaciones queda completa: pista, tiempo extra e indulto, las 3 implementadas.

**Test 15 nuevo** en `docs/test-temporal.mjs`: compra el indulto y confirma el costo, fuerza un error y confirma que no suma a `#errors` pero sí resta el dinero normal, confirma que se consume (el siguiente error sin indulto sí cuenta), que no se puede comprar un segundo mientras uno sigue activo, y que uno sin usar no sobrevive a `endDay()`.

**Bug de test encontrado y corregido (no del código)**: al escribir el test 15 se repitió, sin darse cuenta, el mismo error de los tests 13/14 pero al revés — `gameT.decide(violationT === null)` en vez de `!== null` termina siendo la decisión CORRECTA, no la forzada a incorrecta, así que el primer intento del test no estaba probando nada del indulto (el dinero subía en vez de bajar). Se corrigió invirtiendo la condición, igual que ya se había hecho en los tests anteriores.

**Segundo bug de test, este sí intermitente**: el mismo problema del cobro diario dejando sin fondos que ya se había corregido para el visitante "sucio" del test 13 (ver sesión de la parte 4) se había quedado sin corregir para el caso del visitante "limpio" en el mismo test — como `buscarVisitante()` decide bien una cantidad variable de veces hasta encontrar el visitante que busca, a veces alcanzaba el dinero para la pista y a veces no, dependiendo del sorteo. Detectado corriendo la suite completa varias veces seguidas (falló 1 de 5 corridas) y confirmado estable después de agregar el mismo colchón de decisiones extra que ya tenía el caso "sucio".

Verificado con `npm run build` + los 52 tests de `docs/test-temporal.mjs` (45 anteriores + 7 nuevos), corridos 8 veces seguidas sin fallos para descartar la intermitencia. No se probó en el navegador todavía — queda pendiente confirmar que la tienda completa (pista + tiempo extra + indulto) se siente bien jugando de verdad, no solo en los tests automáticos.

---

2026-08-23 (parte 7) — el botón `$` de la tienda pisaba al de pausa; se reemplaza por un ícono de flor debajo del reloj de arena:

Iralys probó la tienda y el botón `$` (agregado en la parte 4, `right: 6.5%` en el HUD) quedaba pisado con el de pausa. Pidió moverlo al espacio libre debajo del reloj de arena, en la misma columna vertical que ya usan la moneda y el reloj (`left: 10.9%`), y usar como imagen la misma flor rosa que ya aparece pintada junto a DÍA/ERRORES/RACHA en `fondoPantallaJuegoT.png`.

**La flor no existe como archivo aparte** — está dibujada directamente dentro del fondo del HUD, junto a esas tres etiquetas. Se extrajo con Python/PIL (ya usado antes en este proyecto para medir arte a pixel, ver sesión del 2026-08-12): se ubicó el recuadro exacto por detección de color (píxeles rosa/magenta o el centro amarillo, sobre fondo oscuro) y se recortó a `(874, 97)-(945, 166)` de la imagen original (3670×2446), con un margen de unos pixeles. Se le sacó el fondo oscuro a transparente (umbral de brillo, con un borde suavizado en vez de un corte duro) para que se vea limpia sobre cualquier fondo. Queda guardada en `public/img/ui/florHud.png` (carpeta nueva, primer ícono de UI suelto del proyecto — hasta ahora todo vivía pintado en los fondos o en `animaciones/`).

**El botón se movió de lugar en el HTML, no solo en CSS**: pasó de estar adentro de `#hud` (que tiene `pointer-events: none`, por eso necesitaba `pointer-events: auto` antes) a ser hermano directo de `#coin-widget`/`#day-clock` dentro de `#character-scene` (que no bloquea clicks) — mismo criterio que esos dos, ya no hace falta la excepción de pointer-events. También perdió la clase `.exit-to-menu-btn` (ya no comparte su estilo, es un ícono solo, sin fondo/padding/borde) y por lo tanto la exclusión que se le había agregado al handler compartido de esa clase en `main.ts` (`:not(#shop-btn)`) se pudo sacar de nuevo, ya no hacía falta.

**Verificado jugando de verdad**, no solo con los tests: se levantó `public/` con `python -m http.server` y se automatizó una partida completa con Playwright (instalado en el scratchpad de la sesión, no como dependencia del repo, mismo criterio que la prueba de audio del 2026-08-19) hasta la pantalla de juego — capturas confirmando que la flor quedó bien ubicada sin pisar nada, que abrir la tienda y comprar las 3 opciones descuenta el dinero real del HUD y deshabilita los botones que ya no alcanzan, y que "Volver al juego" respeta el visitante que estaba en pantalla.

No se tocó nada de `Game.ts` en esta sesión, solo `index.html`/`style.css`/`main.ts` (posición y comportamiento del botón) — la lógica de las 3 compras ya estaba completa desde la parte 6.

---

2026-08-23 (parte 8) — ícono real de la tienda, movido a `public/img/tienda/`:

Iralys reemplazó el recorte provisorio de la flor (extraído a mano de `fondoPantallaJuegoT.png`, ver parte 7) por arte real: una ilustración completa de tienda (templete, carrito de compras, cofre con lupa y carta de interrogación, gato de la suerte, monedas), 1254×1254, guardada como `public/img/tienda/florHud.png` — carpeta nueva, reemplaza a `public/img/ui/` (que queda vacía y sin uso). Se corrigió la ruta en `style.css` (`background-image` de `#shop-btn`) y los dos comentarios que todavía mencionaban `img/ui/` (`index.html` y `style.css`). Como la imagen nueva también es cuadrada, no hizo falta tocar el `aspect-ratio: 1` del botón.

Verificado con Playwright otra vez (mismo criterio que la parte 7): el ícono nuevo carga y se ve bien en el lugar de siempre, debajo del reloj de arena.

---

2026-08-23 (parte 9) — bug real encontrado: la pantalla de Opciones había quedado con la versión vieja tras el merge grande:

Iralys notó que Opciones se ve distinto en `develop` que en su rama y pidió dejarlo como en `develop`. Investigando (`git diff origin/develop HEAD -- public/index.html`) apareció un bug real de la sesión del merge grande (parte 3, 2026-08-22/23): `index.html` había quedado con la versión VIEJA de Opciones (botón `#mute-toggle-btn`, "Sonido: ON/OFF") en vez de la de `develop` (sliders de volumen, tamaño de pantalla, duración del día y días de partida).

**Por qué pasó**: en aquel merge, `git` marcó `index.html` como conflicto real, pero al revisarlo no aparecían marcadores `<<<<<<<`/`=======`/`>>>>>>>` en ningún lado — se asumió (mal) que ya estaba resuelto y solo faltaba `git add`. En realidad `git` había resuelto la sección de Opciones automáticamente quedándose con el lado de `actualIralys` (la versión vieja, de antes de que existiera el rework de volumen), sin dejar marcadores porque no hubo superposición línea por línea exacta - un merge "limpio" pero semánticamente incorrecto. La lógica de `main.ts` para los 4 sliders (`#volume-slider`, `#zoom-slider`, `#day-duration-slider`, `#total-days-slider`) sí se había traído bien desde `develop` en ese mismo merge (esos conflictos sí tenían marcadores y se resolvieron a mano) - por eso el código funcionaba pero los controles no existían en el HTML, y `#mute-toggle-btn` quedó como botón fantasma sin ningún listener en `main.ts`.

**Corrección**: se reemplazó la sección `#options-screen` de `index.html` por la de `origin/develop` tal cual (los 4 `slider-row` + `#new-game-options`), se sacó `#mute-toggle-btn`. El CSS (`.slider-row`, `#new-game-options`) ya estaba bien desde el merge, no hizo falta tocarlo.

**Lección para mergear**: que un archivo no tenga marcadores de conflicto no prueba que el auto-merge haya elegido el lado correcto en cada sección — hay que comparar contra ambos lados semánticamente, no solo buscar `<<<<<<<`.

Verificado con Playwright: los 4 sliders aparecen y se ven bien en Opciones, `#mute-toggle-btn` ya no existe en ningún lado del código. Se corrió también toda la suite de `docs/test-temporal.mjs` (52 tests, sin relación directa pero por las dudas) — sigue en verde.

**Pendiente, no relacionado con Opciones pero encontrado de paso**: `index.html` todavía trae el `<link>` viejo a Google Fonts (Jost/Marcellus) en el `<head>`, que `develop` ya no tiene (se sacó cuando se decidió alojar las tipografías localmente, ver sesión del 2026-08-15). Es el mismo leftover que ya se había detectado y dejado afuera A PROPÓSITO en un merge anterior hacia `objetosMike` (ver entrada del 2026-08-17), pero nunca se limpió en `actualIralys` misma. No se tocó en esta sesión porque no fue lo que Iralys pidió arreglar.

---

2026-08-23 (parte 10) — auditoría completa contra `develop`: 3 bugs reales más, encontrados y corregidos:

Iralys pidió específicamente: "todo lo que encuentres en develop que no esté en mi rama, incorporalo" — no solo Opciones. Se comparó archivo por archivo (`git diff -w origin/develop HEAD`, y `comm` sobre versiones ordenadas para los archivos de texto largos) para separar 3 categorías: (a) cosas que sí faltan de verdad, (b) diferencias que son solo evolución propia de esta rama que `develop` todavía no tiene (no hay que "corregir" eso, sería un retroceso), y (c) archivos que existen solo en esta rama sin que sea un problema (assets viejos, propuestas, etc.).

**Encontrados y corregidos (categoría a)**:
1. El `<link>` a Google Fonts (Jost/Marcellus) en el `<head>` de `index.html` — el mismo leftover que ya se había anotado como pendiente en la parte 9, ahora sí se sacó.
2. El selector `*` en `style.css` todavía tenía `font-family: 'Jost', sans-serif` a mano, en vez de `var(--font-body)` (que ya apunta a Jersey 10 con sus fallbacks locales) — mismo problema que el punto 1, en otro lugar del archivo.
3. **Bloque `@font-face` de "Jersey 10" duplicado dos veces seguidas** en `style.css`, cada uno con su propio comentario (uno de cuando la fuente era solo para el mensaje de la Jefa, otro de cuando pasó a ser la fuente única) - puro leftover del merge grande, sin ningún efecto funcional (el navegador ignora el duplicado) pero confuso de leer. Se dejó uno solo.

**Revisado y dejado como está a propósito (categoría b, no tocar)**: `body` en `develop` todavía tiene `margin:0; padding:1.5rem;` y `#menu-bg-img` usa `object-fit: cover` con `#menu-stage` en `border-radius:10px` — en esta rama esos tres ya están cambiados (sin margin/padding, `object-fit: contain`, `border-radius:0` + color de fondo de relleno) como parte de un rediseño ya hecho acá para que el fondo del menú se vea completo sin recortarse en cualquier proporción de pantalla. Copiar la versión de `develop` ahí habría sido un retroceso, no una corrección - se dejó como está.

**Revisado y no es un problema (categoría c)**: `especificaciones-economia.md`, `public/img/tienda/florHud.png`, `.opencode/agents/YOKAI_INSPECTOR_REPOSITORY_REVIEW_AGENT.md`, `public/img/backgrounds/Fondopersonaje.png` y `public/sounds/nextPlease.mp3` existen solo en esta rama y no en `develop` — los primeros dos son trabajo propio todavía no fusionado a `develop`; los últimos tres son archivos viejos de sesiones anteriores de Iralys (`Fondopersonaje.png` ya se había decidido dejar afuera de otro merge, ver entrada del 2026-08-15; `nextPlease.mp3` quedó sin borrar de esta rama aunque el código que lo usaba ya se sacó en la parte 3). Ninguno rompe nada estando presente, así que no se tocaron - no era lo que se pidió arreglar hoy.

También se confirmó explícitamente (con `comm` sobre las versiones ordenadas línea por línea) que `docs/diario.md` y `docs/test-temporal.mjs` ya contienen el 100% del contenido de sus versiones en `develop` - nada faltante ahí. Mismo chequeo con `git diff -w` para `Game.ts`/`main.ts`: las únicas líneas que parecían faltar resultaron ser evolución propia de esta rama (el `wasRushed` nuevo en `decide()`, `RICH_BOSS_MONEY` ya en 300) que el diff mostraba raro por el reordenamiento de líneas cercanas, no omisiones reales.

Verificado con `npm run build` + los 52 tests de `docs/test-temporal.mjs` (sin relación directa, cambios de CSS/HTML, pero por las dudas) y con Playwright (captura del menú, confirmando `getComputedStyle(body).fontFamily` ya no depende de Google Fonts) — todo en verde.

---

2026-08-23 (parte 11) — documento de documentación técnica del proyecto entero:

Se usó el agente `.opencode/agents/generar-documentacion-html.md` para generar `documentacion-proyecto.html` (raíz del repo): un mapa completo del código pensado para alguien que no lo escribió — un profesor evaluando, un compañero nuevo, o el propio equipo repasando más adelante. Se hizo sobre esta rama (`actualIralys`) en vez de clonar `develop` aparte, porque a esta altura `actualIralys` ya contiene el 100% de `develop` (confirmado en la parte 10) más el sistema económico/tienda que todavía no llegó a `develop` — documentar desde acá da un mapa más completo y más real.

**Cómo se armó**: se releyó a fondo cada clase (`Passport`, `Character`, `Human`, `Yokai`, `Rule`, `Day`, `Storage`, `Game`, `SoundManager`, `MusicManager`), `main.ts` completo (función por función, vía un listado de todas las declaraciones de nivel superior), `index.html`, varios archivos de `public/data/`, y `docs/convenciones.md`/`GDD.md`/`diario.md` como contexto de decisiones ya tomadas — sin copiar nada tal cual, redactado con palabras propias y verificado contra el código real.

**Hallazgo de paso, no un bug**: `reglas.json` usa el campo `"dia"` como un ID de regla, no como el día calendario en que se activa — es `dias.json` (campo `reglasActivas`) el que remapea esos ids a un día real. Por eso la regla de "sello plateado" tiene `"dia": 6` en `reglas.json` pero en el juego se activa recién el día 7, y la del sello azul de los alien (`"dia": 7` en el archivo) se activa el día 6. Quedó explicado en el documento (sección de persistencia y datos) porque es fácil de leer al revés si alguien mira `reglas.json` suelto sin cruzarlo con `dias.json`.

**4 diagramas Mermaid** (clases, flujo de una partida, secuencia de una decisión, flujo de trabajo del equipo), con código de color para Grupo A/Grupo B, verificados en el navegador con Playwright: los 4 renderizan como SVG sin errores de consola. El de flujo de trabajo del equipo usa un `flowchart` en vez de un `gitGraph` literal — el historial real tiene demasiados merges/ramas como para que un `gitGraph` fiel se leyera bien, así que se resume el patrón (cada quien en su rama, integrando contra `develop`) más 3 bugs de integración reales documentados en el diario, incluido el de la pantalla de Opciones de esta misma sesión (parte 9).

No se modificó ningún archivo de código del proyecto — el agente es de solo lectura, como indica su propia definición.

---

2026-08-23 (parte 12) — documento de preparación para la defensa oral de Iralys:

Se generó `especificaciones-defensa-iralys.md` a partir de un agente nuevo (distinto al de documentación técnica de la parte 11) que Iralys pasó por texto, sin guardarlo como archivo aparte en `.opencode/agents/` — solo se pidió generar el documento, no dejar el agente reutilizable. A diferencia del documento técnico genérico de la parte 11, este es personal y con un alcance mucho más acotado: solo el código de Iralys (`Rule.ts`, `Day.ts`, `Storage.ts`, `Game.ts`, su parte de `main.ts`, `SoundManager.ts`/`MusicManager.ts`), explicado línea por línea, con argumentos de defensa y preguntas de examen ya respondidas en primera persona.

**Se releyeron `Game.ts`, `SoundManager.ts` y `MusicManager.ts` completos de nuevo** (cambiaron mucho en esta sesión con el sistema económico) para citar código exacto, no de memoria. Se marcaron explícitamente dos funciones de `main.ts` como "atribución dudosa" en vez de asignarlas a ciegas: `preloadCharacterImages()`/`preloadImages()` y `startCoinSpin()` — ninguna de las dos es claramente "ciclo de juego" ni claramente "arte/drag&drop", y el diario no deja constancia de quién las escribió.

**Un hallazgo se convirtió en pregunta de examen con respuesta honesta**: la confusión de `reglas.json` usando `"dia"` como ID de regla en vez de día calendario (ya documentada en la parte 11) se redactó como pregunta 7 de la sección final, con una respuesta que reconoce que el nombre del campo podría haber sido mejor (`ruleId`) — a pedido implícito del propio agente, que insiste en preparar respuestas defendibles, no en ocultar decisiones discutibles.

No se modificó ningún archivo de código — mismo criterio de solo lectura que la parte 11.

---

2026-08-23 (parte 13) — la defensa oral pasa a HTML con colores, tablas y diagramas:

Iralys pidió deshacer el commit del `.md` de la parte 12 (nunca se había pusheado, así que se deshizo sin riesgo con `git reset --mixed HEAD~1`, dejando el archivo en el disco) y usarlo como fuente para armar `especificaciones-defensa-iralys.html` — una versión visual del mismo contenido, no un resumen: mismo código citado, mismas explicaciones línea por línea, mismos argumentos de defensa y las 10 preguntas de examen, pero con el sistema de diseño oscuro ya usado en `documentacion-proyecto.html` (parte 11) más elementos nuevos pensados para este documento en particular:

- Un diagrama de flujo mostrando visualmente la trampa de examen de `reglas.json`/`dias.json` (qué ID de regla se activa en qué día calendario real).
- Un gráfico de barras comparando los 7 montos del sistema económico (aciertos, errores, cobro diario, las 3 compras de la tienda) a simple vista.
- Un árbol de decisión completo de `Game.decide()` (correcto/incorrecto, indulto, apuro, derrota) en un solo diagrama.
- Un diagrama de estados para el temporizador (Corriendo/Pausado/EsperandoSuelte/Vencido) y uno de secuencia para el bug real de `SoundManager` (el `AbortError` sin clonar el audio).
- Tablas para las claves de `localStorage`, el patrón `#dayX`/`#lastDayX` de `Game.ts`, y la comparación `SoundManager` vs `MusicManager`.

**Dos diagramas necesitaron un ajuste después de verificarlos con Playwright**: la última nota del diagrama de secuencia de audio quedaba cortada visualmente (texto de dos líneas mal calculado por Mermaid, se acortó a una sola línea con `Note over SM,A2` en vez de `Note over A2` solo), y las etiquetas de `pauseDayTimer()`/`resumeDayTimer()` en el diagrama de estados se superponían por quedar muy pegadas — se acortaron las etiquetas del diagrama y la explicación completa se movió a un párrafo aparte debajo. También se redujo el diagrama de `reglas.json`/`dias.json` de 7 cajas a 3 (agrupando los días 1 a 5, que no tienen truco, y dejando solo los días 6-7 que sí lo tienen) porque con las 7 el texto quedaba demasiado chico para leerse.

El `.md` de la parte 12 queda en el disco, sin trackear en git — solo se commitea el `.html`, que es la versión que Iralys pidió como resultado final.

Verificado con Playwright: los 5 diagramas renderizan como SVG sin errores de consola, confirmado dos veces (antes y después de los ajustes de superposición).

---

2026-08-27 — merge de `develop` a `actualiralys`, con el refactor grande de Mike (Economy/VisitorGenerator/DayTimer/shop/stampDrag) ya integrado:

Conflictos en `docs/test-temporal.mjs`, `src/ts/classes/Game.ts` y `src/ts/main.ts` (18 bloques en total). La causa fue siempre la misma: `develop` había extraído a módulos y clases nuevas (`Economy.ts`, `VisitorGenerator.ts`, `DayTimer.ts`, `shop.ts`, `stampDrag.ts`) exactamente la misma lógica que esta rama todavía tenía escrita inline en `Game.ts`/`main.ts` (economía de la tienda, generación de visitantes, reloj de arena del día, drag and drop de los sellos) — mismo código, solo reorganizado por Mike. Se confirmó comparando cada bloque en conflicto contra el archivo nuevo correspondiente antes de resolver nada; el lado de esta rama ni siquiera compilaba (`Game.ts` usaba campos privados como `#parts`/`#names` que ya no estaban declarados), así que se tomó el lado de `develop` en los 18 bloques.

Los `.js`/`.js.map` compilados en conflicto (`Game.js`, `main.js`) no se resolvieron a mano: se resolvieron primero los `.ts`, y la salida compilada se regeneró con `npm run build`, más confiable que fusionar JS generado a mano.

Verificado con `npm run build` limpio y los 52 tests de `docs/test-temporal.mjs`, todos en verde. No se pusheó — el merge quedó commiteado localmente en `actualiralys`, adelantada respecto a `origin/actualiralys`.

---

2026-08-27 (parte 2) — limpieza de comentarios en las clases propias (Grupo B):

A pedido de Iralys, se sacaron los comentarios explicativos de las clases que le corresponden según `especificaciones-economia.md` (Grupo B): `Rule.ts`, `Day.ts`, `Storage.ts`, `Game.ts`, `SoundManager.ts`, `MusicManager.ts`. No se tocó `main.ts` (autoría mezclada, no es una clase) ni `Economy.ts`/`VisitorGenerator.ts`/`DayTimer.ts` (confirmado por `git log` que son de Mike, aunque salieron de dividir `Game.ts`).

De paso, `Game.ts` perdió un import sin usar (`getHistory`, de `Storage.ts`) y se emparejó la indentación de `decide()`, `endDay()`, `isLost()`/`isWon()`, el getter `currentVisitor` y `loadProgress()`, que tenían menos sangría que el resto de la clase desde antes.

**Un intento fallido**: simplificar el tipo de retorno de `getAllCredits()` en `Storage.ts`, de `Record<string, number>` a `any`, rompió la compilación de `records.ts` (TypeScript perdía el tipo en `Object.entries(credits)`) — se revirtió. Ese `Record` no era capricho de más experiencia de la cuenta, hacía falta ahí para que el resto del código siguiera tipando bien.

---

2026-08-30 — investigación (falsa alarma) del control de tamaño de pantalla en Opciones:

Iralys reportó que el slider "Tamaño de la pantalla de juego" (`#zoom-slider`, controla `--scene-zoom` sobre `#character-scene`, ver `style.css:1033-1048` y `main.ts:197-202`) andaba bien al agrandar pero desconfiguraba el layout al volver a un tamaño más chico. Diagnóstico inicial por lectura de código (`docs/diagnostico-tamano-pantalla.md`) no encontró ninguna causa de lógica (no hay acumulación de valores, ni `px` fijos, ni caché de tamaños viejos en JS — todo el HUD/pasaporte/sellos usa `%`/`cqw` relativos a `#character-scene`), así que quedó como hipótesis abierta un posible caso límite del motor de layout con `container-type: inline-size` + `aspect-ratio` + `calc(var())` en el mismo elemento.

Se armó una prueba automatizada con Playwright (Chromium headless) contra el `public/` servido localmente: subir el slider a 140, bajarlo a 120 y volver a 100, midiendo `getBoundingClientRect()` de `#character-scene` y varios elementos hijos en cada paso, más capturas de pantalla. Primero sobre el escritorio vacío, después con una escena completa simulada (personaje con cara/ojos/boca/pelo/cuernos, pasaporte abierto con texto, los 3 sellos habilitados). En los dos casos el tamaño/posición volvió exactamente igual al bajar de nuevo a 100 (la única diferencia detectada, un `y` distinto en `#character-portrait`, resultó ser la animación `idle-bob` normal, no el zoom) y las capturas de los 3 pasos se veían proporcionadas, sin superposiciones.

**Conclusión de Iralys, confirmada al probarlo de nuevo**: fue un error de su pantalla/navegador en el momento, no un bug real del juego. No se tocó código. Se deja documentado por si el diagnóstico (`docs/diagnostico-tamano-pantalla.md`) hace falta de referencia más adelante, pero no representa un bug pendiente.

---

2026-08-30 (parte 2) — tanda de 3 bugs + 1 reportado sobre la marcha, todos en zona de Iralys:

Se ejecutó un prompt de corrección de bugs (con las restricciones del curso: nada de `interface`/genéricos/uniones/`try-catch`/`async-await`/`Map`/`Set`, comentarios en español, solo clases básicas) paso a paso, con revisión y commit de Iralys después de cada uno.

**Bug 1 — botón para cerrar la ventana en la pantalla de salir**: agregado `#close-window-btn` en `#exit-screen` ([public/index.html](../public/index.html)) con su listener en `main.ts`, que llama `window.close()`. Documentada la limitación real: los navegadores solo dejan cerrar así una pestaña que el propio script abrió, en el resto lo ignoran en silencio (sin excepción, no hace falta `try/catch`).

**Bug 2 — el día podía cortar una decisión a la mitad**: el reporte original ("al cambiar de día no se puede decidir sobre el primer pasajero") no se pudo reproducir tal cual estaba escrito — probado con Playwright (temporizador del día acelerado), el primer visitante de cada día siempre se pudo decidir con normalidad. El bug real, que Iralys precisó después de ver el resultado de esa primera prueba, era otro: si el temporizador del día vencía **mientras un visitante seguía sin decidir** (pasaporte sin abrir, o abierto pero sin soltar el sello), `game.endDay()` se disparaba igual y se lo saltaba de golpe — reproducido en el día 4 jugando de verdad. Corregido moviendo `dayTimer.markResolving()` (existía, pero recién se activaba al soltar el sello) al principio de `renderVisitor()`, así el día queda protegido desde que el visitante aparece en pantalla hasta que termina de decidirse, sin importar cuánto tarde el jugador. Verificado con Playwright en los dos escenarios (pasaporte nunca abierto, y abierto sin decidir) más el caso normal, sin regresiones.

**Bug 3 — "NUEVA REGLA"/"¡ERROR!" chico e inconsistente**: confirmado que `#notice-kicker` estaba en 0.65rem (casi la mitad del 1.15rem de `#next-day-message`, el texto de abajo) con una fuente de fallback distinta. Parejado a `--font-jefa` y subido a 1rem.

**Cursor parpadeando en la pantalla de derrota/victoria (reportado por Iralys sobre la marcha, no estaba en el prompt original)**: investigado a fondo sin lograr reproducirlo — 6 pruebas con Playwright distintas (derrota por teclado, derrota arrastrando el sello con mouse real, victoria vía `Game.isWon()` parcheado, tocar `#player-name-input` sin enviar el formulario y perder después, y presionar Tab ya parado en la pantalla final) siempre dieron `document.activeElement === document.body`, sin ningún input con foco. No hay un solo `.focus()` en todo el código: el único input real (`#player-name-input`) se remueve el foco explícitamente al enviar el formulario, y `changeState()` remueve el foco de cualquier elemento activo en cada cambio de pantalla, sin excepciones. Iralys dio por cerrado el tema sin evidencia adicional — no se tocó código para esto.

Los 3 bugs corregidos quedan en 3 commits separados en `actualiralys` (uno por bug), cada uno revisado por Iralys antes de commitear.

Verificado con `npm run build` limpio y los 52 tests de `docs/test-temporal.mjs`, todos en verde — ningún cambio de comportamiento, solo comentarios, un import muerto y formato.