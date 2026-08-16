Lenguaje: TypeScript simple (sin interfaces, genéricos, ni tipos unión/intersección), compilado a JavaScript plano con `tsc`. Sin frameworks ni bundlers.

Nombres de clases, campos y métodos: en inglés. En una limpieza posterior (ver diario.md) esto se extendió a TODO nombre de código — variables locales, parámetros, tipos, y los strings que se usan como nombre de estado interno (ej. clases CSS que main.ts arma/lee via classList, como `"open"`/`"closed"`/`"dragging"`) — no solo clases/campos/métodos.

Excepciones que se mantienen en español a propósito:
- Valores de los datos (contenido de los archivos `.json` en `public/data/`): en español, sin traducir — por ejemplo `"humano"`, `"oni"`, `"rio"`, `"negro"`. El código compara contra esos strings tal cual están. Esto incluye tanto los VALORES como las claves de esquema que vienen de esos archivos (ej. `parts.rostro`, `parts.ojos`, `parts.boca` en `partes.json`) - cambiarlas implicaría tocar el archivo de datos, no solo el código.
- Nombres de código (ids HTML, clases CSS, constantes) que estén directamente atados al nombre de un archivo de arte ya existente en el repo (ej. `jefaExplica-1.png` → clase `.jefaExplica-1`, `moneda-1.png` → clase `.moneda-1`, `selloRojoPosicion1.png` → clase `.stamp-rojo`) - renombrar el código sin renombrar el archivo dejaría el nombre desalineado con el asset real.
- Todo el texto/diálogo visible para el jugador, y los comentarios del código (se mantienen en español, es el idioma de trabajo del equipo).

Encapsulamiento: campos siempre privados con `#`, nunca `public` directo.

Estilo de acceso a los campos:
- `Character`, `Human`, `Yokai`, `Passport`: los getters simples son `get` accessors (se llaman sin paréntesis, ej. `personaje.obtainName`).
- `Rule`, `Day`, `Game`: los getters son métodos normales con paréntesis (ej. `regla.getDay()`), salvo los campos simples de `Game` (`dayNumber`, `errors`, `money`, `currentVisitor`, `currentDay`, `playerName`), que sí son `get` accessors.

Evitar `switch` — preferencia mencionada en clase por el profesor, usar cadenas de `if`/`else if` en su lugar. (Excepción: `Rule.isViolated()` quedó con `switch`, a cargo de Iralys si el profesor lo señala.)

Nada de `try/catch` — validar con `if` (ej. `if (dato === null)`).

Nada de `var` — solo `const`/`let`.

Nada de `async`/`await` — carga de datos con `Promise.all(...).then()/.catch()`.

Separación de responsabilidades: las clases de dominio (`Character`, `Passport`, `Rule`, `Day`) no tocan el DOM ni `localStorage`. `Game` orquesta la partida. `Storage` son funciones sueltas para `localStorage`. `main.ts` conecta `Game` con la interfaz.

Persistencia con `localStorage` vía `Storage.ts` (`saveCurrentGame`, `loadCurrentGame`, `deleteCurrentGame`, `saveToHistory`, `getHistory`), usando `JSON.stringify`/`JSON.parse`.

Imports relativos siempre con extensión `.js` (aunque el archivo fuente sea `.ts`), por la configuración de `tsconfig.json` (`module`/`moduleResolution: "NodeNext"`).
