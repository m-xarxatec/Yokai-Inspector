Lenguaje: TypeScript simple (sin interfaces, genéricos, ni tipos unión/intersección), compilado a JavaScript plano con `tsc`. Sin frameworks ni bundlers.

Nombres de clases, campos y métodos: en inglés.

Valores de los datos (contenido de los archivos `.json` en `public/data/`): en español, sin traducir — por ejemplo `"humano"`, `"oni"`, `"rio"`, `"negro"`. El código compara contra esos strings tal cual están.

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
