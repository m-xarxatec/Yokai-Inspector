# Yokai Inspector explicado desde cero

Este documento está escrito para alguien que **nunca programó en su vida**. No hace falta saber nada de antemano: vamos a construir el conocimiento paso a paso, como en una clase, empezando por las ideas más simples y terminando por las piezas más complejas del juego.

Si en algún punto una palabra no se entiende, probablemente esté en el **Glosario** del final. Y si algo se explica "en simple" en una sección y con más detalle técnico más adelante, es a propósito: primero la idea, después la letra chica.

---

## 1. Antes de nada: ¿qué es "programar"?

Programar es escribir una **receta de cocina** para una computadora: una lista de instrucciones, en un orden exacto, que la máquina va a seguir al pie de la letra. La computadora no "entiende" lo que hace — solo ejecuta instrucciones, una tras otra, exactamente como están escritas.

La diferencia con una receta de cocina es que un programa puede **tomar decisiones** ("si el visitante tiene cuernos, rechazarlo") y **repetir pasos** ("por cada regla activa del día, revisar si se rompió"). Todo lo que vas a ver en este documento son formas más o menos elaboradas de "dar instrucciones" y "tomar decisiones".

---

## 2. Los tres lenguajes de una página web

Cualquier cosa que ves en un navegador (Chrome, Firefox, etc.) está construida con tres lenguajes que trabajan juntos. Una analogía que ayuda: pensar en una persona.

| Lenguaje | Rol | Analogía | Dónde vive en este proyecto |
|---|---|---|---|
| **HTML** | Qué elementos existen en la pantalla | El **esqueleto**: define que hay una cabeza, dos brazos, etc. | `public/index.html` |
| **CSS** | Cómo se ven esos elementos | La **ropa y el maquillaje**: colores, tamaños, posiciones, animaciones | `public/styles/style.css` |
| **JavaScript** | Cómo reacciona todo a lo que hace el jugador | El **cerebro**: decide qué pasa cuando alguien hace clic, cuenta el dinero, genera visitantes nuevos | `public/js/*.js` (generado a partir de `src/ts/*.ts`, ver sección 4) |

Sin HTML no habría nada que mostrar. Sin CSS, todo se vería como una lista de texto plano, sin estilo. Sin JavaScript, los botones existirían pero no harían nada al presionarlos: sería una foto, no un juego.

**Para recordar:** HTML = qué hay, CSS = cómo se ve, JavaScript = qué hace.

---

## 3. ¿Qué es "Yokai Inspector"?

Es un juego de navegador inspirado en *Papers, Please*: el jugador es un inspector de aduanas que revisa pasaportes de visitantes (humanos y *yokais*, criaturas del folclore japonés) y decide si los deja entrar o no, según reglas que van cambiando y sumándose día a día. Cada decisión correcta da dinero; cada error acerca al jugador a perder la partida.

El juego está pensado como un ejercicio de **programación orientada a objetos** (POO, ver sección 6) hecho por un equipo de estudiantes (Iralys y Mike) para el curso Xarxatec Activa, sin usar ningún framework (React, Vue, etc.) — todo está escrito "a mano" con las herramientas básicas del navegador.

### Recorrido rápido de carpetas

```
Yokai-Inspector/
├── src/ts/            ← el código que ESCRIBE el equipo (TypeScript)
│   └── classes/        ← las "piezas" del juego: Game, Character, Rule...
├── public/             ← lo que el navegador realmente carga
│   ├── index.html       ← el esqueleto (todas las pantallas del juego)
│   ├── styles/style.css ← la ropa (todo el diseño visual)
│   ├── js/               ← el cerebro YA TRADUCIDO a JavaScript (ver sección 4)
│   └── data/*.json       ← los "ingredientes" del juego: nombres, reglas, frases...
├── tsconfig.json       ← instrucciones para traducir src/ts a public/js
├── package.json        ← metadatos del proyecto y comandos disponibles
└── docs/               ← documentos como este
```

**Para recordar:** el equipo escribe en `src/ts/`, pero el navegador nunca lee esa carpeta directamente — lee `public/js/`, que se genera automáticamente a partir de ella.

---

## 4. TypeScript: JavaScript con un corrector ortográfico incorporado

El navegador **solo entiende JavaScript**. Nunca entendió, ni entenderá, TypeScript directamente. Entonces, ¿por qué el equipo escribe en `src/ts/*.ts` en vez de escribir `.js` directamente?

Porque TypeScript es JavaScript **más un sistema de tipos**: una capa extra que obliga a decir, por ejemplo, "esta variable siempre va a ser un número" o "esta función recibe un texto y devuelve verdadero o falso". Si en algún lugar del código se intenta usar esa variable de forma incorrecta (por ejemplo, sumarle texto a un número por error), TypeScript avisa **antes de ejecutar el juego**, no cuando ya está roto en manos del jugador. Es como un corrector ortográfico, pero para la lógica del programa.

Ejemplo real, de [`Passport.ts`](../src/ts/classes/Passport.ts):

```ts
constructor(name: string, region: string, declaredSpecie: string, stamp: string){
```

El `: string` después de cada nombre le dice a TypeScript "esto siempre va a ser texto". Si en algún lugar del proyecto alguien intentara crear un pasaporte pasándole un número en vez de un texto, TypeScript se quejaría al traducir el código, mucho antes de que el juego llegue a ejecutarse.

### El paso de traducción (compilar)

Como el navegador no entiende TypeScript, hace falta un paso de **traducción** (se llama "compilar") que convierte cada archivo `.ts` en un archivo `.js` equivalente. Ese paso lo hace una herramienta llamada `tsc` (TypeScript Compiler), y las instrucciones de cómo traducir están en [`tsconfig.json`](../tsconfig.json):

```json
{
  "compilerOptions": {
    "rootDir": "src/ts",
    "outDir": "public/js",
    ...
  }
}
```

Esto dice, en criollo: "agarrá todo lo que está en `src/ts`, traducilo, y dejá el resultado en `public/js`". El comando para disparar esta traducción está en [`package.json`](../package.json):

```json
"scripts": {
  "build": "tsc"
}
```

Es decir, cuando alguien del equipo corre `npm run build` en la terminal, se ejecuta `tsc`, que lee todos los `.ts` y escribe los `.js` correspondientes en `public/js/`. **Ese `public/js/` es lo único que el navegador realmente carga** — por eso `index.html` termina con:

```html
<script type="module" src="js/main.js"></script>
```

apuntando a `public/js/main.js`, no a `src/ts/main.ts`.

**Para recordar:** se programa en TypeScript por seguridad y comodidad, pero el navegador solo ejecuta JavaScript. `tsc` traduce uno al otro.

---

## 5. Los ladrillos de cualquier programa

Antes de meternos en las clases del juego, repasemos las piezas más chicas — las que se usan en absolutamente todos lados del código.

### 5.1 Variables: cajas con nombre

Una variable es una caja con una etiqueta, donde se guarda un valor. En TypeScript hay dos formas de declararla:

```ts
let streak: number = 0;        // el valor PUEDE cambiar más adelante
const HINT_COST = 3;            // el valor NUNCA va a cambiar
```

`streak` (la racha de aciertos seguidos del jugador) cambia todo el tiempo durante la partida — por eso es `let`. `HINT_COST` (el costo de la pista en la tienda, [`Economy.ts:6`](../src/ts/classes/Economy.ts)) es un número fijo que nunca varía — por eso es `const`. Este proyecto tiene una regla de equipo (ver `docs/convenciones.md`) de **nunca usar `var`** (una forma más antigua y menos segura de declarar variables), solo `const`/`let`.

### 5.2 Tipos de datos básicos

- **`string`** (texto): `"Nueva partida"`, `"oni"`, el nombre del jugador.
- **`number`** (número): `10` (dinero inicial), `4` (errores máximos).
- **`boolean`** (verdadero/falso): `true`/`false` — por ejemplo, `haveHorns: boolean` en [`Character.ts`](../src/ts/classes/Character.ts) dice si el personaje tiene cuernos o no.
- **`null`**: "no hay nada acá todavía". Por ejemplo, `#currentVisitor: Character | null` en [`Game.ts:17`](../src/ts/classes/Game.ts) empieza en `null` porque, antes de generar al primer visitante, literalmente no hay ningún visitante en pantalla.
- **Array** (lista ordenada): `["playa", "ciudad", "rio", "bosque", "montana"]`, la lista de regiones posibles de un pasaporte ([`VisitorGenerator.ts:78`](../src/ts/classes/VisitorGenerator.ts)).
- **Objeto**: un paquete de varios datos relacionados bajo un mismo nombre, por ejemplo `{ left: 58, top: 71, height: 3 }` en [`main.ts:81`](../src/ts/main.ts), que agrupa las tres coordenadas de un punto del recorrido del pasaporte.

### 5.3 Funciones: recetas reutilizables

Una función es un bloque de instrucciones al que le ponemos nombre para poder llamarlo cuantas veces haga falta, sin reescribirlo cada vez. Ejemplo simplificado, inspirado en [`coinSpin.ts`](../src/ts/coinSpin.ts):

```ts
function saludar(nombre: string): string {
  return "Hola, " + nombre;
}

saludar("Iralys"); // devuelve "Hola, Iralys"
saludar("Mike");   // devuelve "Hola, Mike"
```

`nombre: string` es el **parámetro** (lo que la función recibe), y `: string` después de los paréntesis dice qué tipo de dato **devuelve**. Cuando una función no necesita devolver nada, se anota `: void` — por ejemplo `resetForNewDay(): void` en [`Economy.ts`](../src/ts/classes/Economy.ts), que solo reinicia unos contadores internos y no entrega ningún resultado hacia afuera.

### 5.4 Condicionales: tomar decisiones

El `if`/`else` es la forma más básica de decir "hacé esto SI se cumple tal condición, si no, hacé otra cosa". De [`Rule.ts:34`](../src/ts/classes/Rule.ts) (simplificado):

```ts
if (this.#property === "tieneCuernos") {
  return character.obtainHaveHorns === this.#forbiddenValue;
}
```

Esto se lee: "si la propiedad de esta regla es `'tieneCuernos'`, entonces comparar si el personaje tiene cuernos contra el valor prohibido". El equipo tiene una convención de **evitar `switch`** (una forma alternativa de encadenar condiciones) y usar cadenas de `if`/`else if` en su lugar, salvo en este método puntual de `Rule.ts` que quedó con `switch` desde antes de esa convención.

### 5.5 Recorrer listas sin bucles clásicos

En vez del clásico `for (let i = 0; i < lista.length; i++)`, este proyecto usa **métodos de array**: funciones que ya vienen "pegadas" a cualquier lista y resuelven los recorridos más comunes de forma más legible.

- **`.forEach()`**: hacer algo con cada elemento, sin esperar un resultado. Ejemplo de [`main.ts:283`](../src/ts/main.ts):
  ```ts
  document.querySelectorAll(".back-link").forEach(button => {
    button.addEventListener("click", () => { /* ... */ });
  });
  ```
  "Por cada botón con la clase `.back-link`, engancharle este comportamiento al hacer clic."

- **`.map()`**: transformar cada elemento de una lista en otra cosa, devolviendo una lista nueva del mismo largo. De [`Game.ts:78`](../src/ts/classes/Game.ts):
  ```ts
  const rules = rawRules.map((r: any) => new Rule(r.dia, r.propiedad, r.valorProhibido, r.descripcion));
  ```
  "Convertí cada objeto de datos en bruto (`rawRules`, leído de `reglas.json`) en un objeto `Rule` de verdad."

- **`.filter()`**: quedarse solo con los elementos que cumplen una condición. De [`Day.ts`](../src/ts/classes/Day.ts) (usado adentro de `.find`, ver siguiente punto) o de [`VisitorGenerator.ts:61`](../src/ts/classes/VisitorGenerator.ts):
  ```ts
  return fullPool.filter((value: string) => !forbiddenToday.includes(value));
  ```
  "De toda la lista de valores posibles, quedate solo con los que HOY no están prohibidos."

- **`.find()`**: encontrar el primer elemento que cumple una condición (o nada, si ninguno cumple). De [`Day.ts:34`](../src/ts/classes/Day.ts):
  ```ts
  const violatedRule = this.#activeRules.find((rule: Rule) => rule.isViolated(character));
  ```
  "De todas las reglas activas hoy, encontrame la primera que este personaje esté violando."

- **`.some()`**: responder sí/no a "¿hay al menos un elemento que cumpla esto?". De [`Game.ts:134`](../src/ts/classes/Game.ts):
  ```ts
  return this.currentDay.getActiveRules().some((rule: Rule) => rule.getProperty() === "selloAlien");
  ```
  "¿Hay alguna regla activa hoy sobre el sello de los alien?"

Todas estas funciones reciben, entre paréntesis, otra función más chica (`rule => rule.isViolated(character)`) que describe **qué** hacer con cada elemento — esta forma compacta de escribir una función se llama **arrow function** (función flecha), y es la que vas a ver en el 90% del código de este proyecto en vez del `function` tradicional de la sección 5.3.

**Para recordar:** casi todo lo que en otros lenguajes se escribiría como un bucle manual, acá se escribe como un método de array encadenado (`.map()`, `.filter()`, `.find()`, `.some()`, `.forEach()`). Es más corto y, una vez que se conocen los nombres, más fácil de leer en voz alta.

---

## 6. Programación orientada a objetos (POO): el corazón del proyecto

Esta es la idea más importante de todo el proyecto, y todo lo que viene después se apoya en ella.

### 6.1 La idea, en una analogía

Pensá en un **molde para hacer galletitas**. El molde en sí no es una galletita — es la forma que le vas a dar a la masa. Con un mismo molde podés hacer 50 galletitas distintas, cada una hecha de masa diferente (una con chocolate, otra sin), pero todas con la misma forma general.

En programación, ese molde se llama **clase**, y cada galletita hecha con ese molde se llama **instancia** (o "objeto"). La clase `Character` en este proyecto es el molde de "cualquier personaje que llega a la ventanilla"; cada visitante concreto que aparece en pantalla es una instancia distinta de esa clase, con su propio nombre, su propia cara, sus propios cuernos (o no).

### 6.2 Una clase real, paso a paso

Vamos a leer [`Passport.ts`](../src/ts/classes/Passport.ts) completo, porque es la clase más simple del proyecto:

```ts
export class Passport {
    #name: string;
    #region: string;
    #declaredSpecie: string;
    #stamp: string;

    constructor(name: string, region: string, declaredSpecie: string, stamp: string){
        this.#name = name;
        this.#region = region;
        this.#declaredSpecie = declaredSpecie;
        this.#stamp = stamp;
    }

    get obtainName() {
        return this.#name;
    }
    // ... y así con region, declaredSpecie, stamp
}
```

Desglosemos cada pieza:

- **`class Passport`**: acá empieza el molde. De ahora en más, "Passport" es un tipo de cosa que se puede crear.
- **`#name`, `#region`, etc.**: son los **campos** (a veces llamados "propiedades" o "atributos") — los datos que cada pasaporte va a guardar. El símbolo `#` al principio significa que ese dato es **privado**: solo el propio objeto puede leerlo o cambiarlo directamente: nada de afuera puede hacer `pasaporte.#name = "otro nombre"` a mano. Es una protección: obliga a que cualquier lectura pase por una puerta controlada (los `get`, ver más abajo), en vez de dejar que cualquier parte del código manosee los datos internos sin control. A esta idea se la llama **encapsulamiento**.
- **`constructor(...)`**: es la función especial que se ejecuta **una sola vez**, en el momento exacto en que se crea un pasaporte nuevo. Recibe los datos de afuera (`name`, `region`, etc.) y los guarda adentro, en los campos privados.
- **`this`**: dentro de una clase, `this` significa "este objeto en particular, el que se está creando o usando ahora". `this.#name = name` se lee como "el nombre DE ESTE pasaporte es el que me pasaron por parámetro".
- **`get obtainName()`**: es un **getter**, una forma de leer un dato privado desde afuera de manera controlada. Se usa sin paréntesis: `pasaporte.obtainName`, no `pasaporte.obtainName()`. Es la "puerta" de la que hablábamos antes: el mundo exterior puede *leer* el nombre, pero no *escribirlo* directamente, porque no existe ningún método que lo permita.

Para crear un pasaporte concreto ("una galletita con este molde"), en algún otro archivo se escribe algo como:

```ts
const passport = new Passport("Aiko", "playa", "humano", "verde");
```

La palabra clave `new` es la que efectivamente "hornea la galletita": ejecuta el `constructor` con esos cuatro datos y devuelve un pasaporte nuevo, listo para usar.

### 6.3 Herencia: familias de clases

Mirá esta clase, [`Human.ts`](../src/ts/classes/Human.ts):

```ts
export class Human extends Character {
    constructor(name: string, passport: Passport, face: string, eyes: string, yellowEyes: boolean, mouth: string,
        horns: string, haveHorns: boolean, hair: string, phrase: string){
            super(name, passport, face, eyes, yellowEyes, mouth, horns, haveHorns, hair, phrase);
        }
}
```

`extends Character` dice: "`Human` es un tipo particular de `Character`". Esto se llama **herencia**: `Human` automáticamente tiene todo lo que ya tiene `Character` (nombre, pasaporte, cara, ojos, etc. — ver [`Character.ts`](../src/ts/classes/Character.ts)) sin tener que volver a escribirlo. `super(...)` significa "llamá al constructor de la clase de la que heredo (`Character`), pasándole estos mismos datos" — es literalmente la clase padre haciendo su parte del trabajo de armado.

`Yokai.ts` hace lo mismo, pero agrega un dato propio que `Human` no tiene:

```ts
export class Yokai extends Character {
    #yokaiType: string;   // "oni" | "kitsune" | "kappa"

    constructor(name: string, passport: Passport, /* ...mismos datos que Character... */, yokaiType: string){
            let yellowEyes = false;
            let haveHorns = false;
            if (yokaiType === "oni") haveHorns = true;
            if (yokaiType === "kitsune") yellowEyes = true;
            super(name, passport, face, eyes, yellowEyes, mouth, horns, haveHorns, hair, phrase);
            this.#yokaiType = yokaiType;
        }

    get obtainYokaiType(): string {
        return this.#yokaiType;
    }
}
```

Fijate la lógica antes de `super(...)`: decide automáticamente que un `oni` tiene cuernos y que un `kitsune` tiene ojos amarillos, según su tipo. Esto es interesante porque `Character` (la clase padre) es **abstracta** (`export abstract class Character`, en [`Character.ts:3`](../src/ts/classes/Character.ts)): eso significa que **nunca se puede crear un `Character` "pelado"** con `new Character(...)` — solo se pueden crear sus hijas concretas, `Human` o `Yokai`. `Character` existe únicamente para juntar lo que ambas tienen en común.

```
        Character (abstracta — nunca se crea directamente)
        ╱                    ╲
    Human                  Yokai
(sin tipo extra)     (+ yokaiType: "oni"/"kitsune"/"kappa")
```

### 6.4 Un método que no es solo "leer un dato"

No todos los métodos de una clase son getters. [`Character.ts:72`](../src/ts/classes/Character.ts) tiene uno que calcula algo:

```ts
isAlien(): boolean {
    return this.#face.startsWith("alien");
}
```

Esto no lee un campo privado directamente: **calcula** un resultado (si el nombre de la cara empieza con la palabra "alien") cada vez que se llama. La diferencia entre un dato guardado (un campo) y un dato calculado al vuelo (un método) es una de las decisiones de diseño más comunes en POO: acá se eligió *calcular* si un personaje es alien en vez de *guardar* un campo aparte, porque ese dato ya está completamente determinado por la cara que tiene.

**Para recordar:**
- **Clase** = molde. **Instancia** (`new Clase(...)`) = algo hecho con ese molde.
- **Campo privado (`#dato`)** = información que el objeto guarda para sí mismo.
- **Getter (`get algo()`)** = puerta de solo lectura hacia un campo privado.
- **`extends`/`super`** = "esta clase es un tipo particular de otra, y reutiliza su construcción".
- **Clase abstracta** = un molde que agrupa lo común, pero nunca se usa para crear objetos directamente — solo sus clases hijas.

---

## 7. Los "ingredientes" del juego: archivos JSON

Las clases (`Rule`, `Day`, `Character`...) son los **moldes**. Pero, ¿de dónde salen los nombres de los visitantes, las frases que dicen, las reglas de cada día? De archivos de datos en `public/data/`, en un formato llamado **JSON** (*JavaScript Object Notation*).

JSON es una forma de escribir datos (texto, números, listas, objetos) en un archivo de texto plano, sin ninguna lógica ni instrucciones — solo información. Un fragmento simplificado de [`public/data/reglas.json`](../public/data/reglas.json) podría verse así:

```json
[
  { "dia": 1, "propiedad": "tieneCuernos", "valorProhibido": true, "descripcion": "Prohibida la entrada a quien tenga cuernos." }
]
```

Es exactamente la misma forma que un objeto de JavaScript/TypeScript (sección 5.2), pero guardada en un archivo aparte en vez de escrita directamente en el código. La ventaja es enorme: **para agregar o cambiar una regla del juego no hace falta tocar ningún archivo `.ts`**, alcanza con editar el JSON.

### Cómo el juego "lee" esos archivos: `fetch`

`fetch` es la función del navegador para pedir un archivo (o, más en general, cualquier recurso) sin recargar la página entera. En [`Game.ts:68`](../src/ts/classes/Game.ts):

```ts
Promise.all([
    fetch("data/partes.json").then(r => r.json()),
    fetch("data/nombres.json").then(r => r.json()),
    fetch("data/frases.json").then(r => r.json()),
    fetch("data/reglas.json").then(r => r.json()),
    fetch("data/dias.json").then(r => r.json()),
    fetch("data/sellos.json").then(r => r.json()),
    fetch("data/species.json").then(r => r.json())]).then(([parts, names, phrases, rawRules, rawDays, stamps, species]) => {
        this.#visitorGenerator.setData(parts, names, phrases, stamps, species);
    // acá ya llegaron los 7 archivos, listos para usar
    ...
}).catch(error => {
    console.log("no se pudieron cargar los datos del juego", error);
});
```

Pedir un archivo por internet (o desde el disco, en este caso) **no es instantáneo**: tarda un tiempito, por más chico que sea. Como el resto del programa no se puede quedar "congelado" esperando, `fetch` no devuelve el archivo directamente: devuelve una **promesa** (`Promise`), que es literalmente eso — una promesa de que, más adelante, va a llegar un resultado (o un error). `.then(...)` dice "cuando llegue el resultado, hacé esto con él"; `.catch(...)` dice "si algo sale mal en el camino, hacé esto otro en su lugar" (en este caso, avisar en la consola y con una alerta).

`Promise.all([...])` junta varias promesas (acá, 7 pedidos de archivos distintos) y espera a que **todas** terminen antes de seguir — así el juego no arranca a medio cargar, con algunos datos listos y otros no.

Esta es la forma "moderna sin `async`/`await`" de esperar datos: el equipo decidió (ver `docs/convenciones.md`) no usar `async`/`await` (otra sintaxis más corta para lo mismo) para mantener el código más explícito sobre cuándo algo es asincrónico.

**Para recordar:** los archivos `.json` son los ingredientes (datos puros, sin lógica); `fetch` + `Promise` son la forma de "ir a buscarlos" sin congelar el juego mientras tanto.

---

## 8. Guardar la partida: `localStorage`

Cuando cerrás la pestaña del navegador y volvés a abrir el juego, ¿cómo hace para acordarse de tu partida en curso o de tus mejores puntajes? El navegador ofrece un espacio de almacenamiento llamado **`localStorage`**: literalmente una cajita de texto que sobrevive aunque se cierre la página, atada al sitio web que la creó.

`localStorage` solo puede guardar **texto**. Pero los datos del juego (número de día, errores, dinero...) son objetos y números, no texto. La solución, en [`Storage.ts`](../src/ts/Storage.ts):

```ts
export function saveCurrentGame(data: any): void {
  localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(data));
}

export function loadCurrentGame(): any {
  return loadJson(CURRENT_GAME_KEY, null);
}
```

- **`JSON.stringify(data)`**: convierte un objeto de TypeScript en un texto con formato JSON (lo contrario de lo que vimos en la sección 7). Es literalmente "empaquetar el objeto en una cadena de texto para poder guardarlo".
- **`JSON.parse(texto)`** (usado adentro de `loadJson`, ver más abajo): hace lo inverso, "desempaquetar" el texto guardado y devolverlo como un objeto usable de nuevo.

```ts
function loadJson(key: string, fallback: any): any {
  const rawData = localStorage.getItem(key);
  if (rawData === null) {
    return fallback;
  }
  return JSON.parse(rawData);
}
```

Esta función chiquita evita repetir, en cada lugar donde se lee algo guardado, el mismo chequeo de "¿y si todavía no se guardó nada?" (por ejemplo, la primerísima vez que alguien abre el juego). Es un ejemplo de una idea muy importante en programación: **si vas a escribir el mismo patrón dos o más veces, conviene convertirlo en una función y llamarla desde los distintos lugares**, en vez de copiar y pegar.

`Storage.ts` guarda, entre otras cosas: la partida en curso (para "Continuar"), el historial de las últimas 3 partidas, el nombre del jugador, los créditos acumulados por nombre, y la racha de resultados consecutivos (victorias o derrotas seguidas, que decide qué final especial se muestra — ver sección 12).

**Para recordar:** `localStorage` guarda solo texto; `JSON.stringify`/`JSON.parse` son el "empaquetado" y "desempaquetado" que permiten guardar y recuperar objetos completos ahí adentro.

---

## 9. El cerebro de las reglas del juego

Ahora que tenemos el vocabulario básico, podemos leer las piezas que deciden si un visitante pasa o no.

### 9.1 `Rule`: una sola regla

Una `Rule` (ver [`Rule.ts`](../src/ts/classes/Rule.ts)) representa una única condición de rechazo, por ejemplo "prohibida la entrada a quien tenga cuernos". Guarda cuatro datos: en qué día aparece, qué propiedad revisa (`"tieneCuernos"`, `"region"`, `"sello"`...), qué valor está prohibido para esa propiedad, y el texto descriptivo que se le muestra al jugador.

Su método más importante, `isViolated(character)`, devuelve `true` o `false` según si **ese personaje en particular** rompe **esta regla en particular**:

```ts
isViolated(character: Character): boolean {
    switch (this.#property) {
      case "tieneCuernos":
        return character.obtainHaveHorns === this.#forbiddenValue;
      case "region":
        return character.obtainPassport.obtainRegion === this.#forbiddenValue;
      // ...
    }
}
```

### 9.2 `Day`: el conjunto de reglas activas hoy

Un `Day` (ver [`Day.ts`](../src/ts/classes/Day.ts)) agrupa varias `Rule` — todas las que están activas ese día en particular (los días posteriores acumulan las reglas de los días anteriores, más una nueva). Su método clave:

```ts
evaluateCharacter(character: Character): Rule | null {
    const violatedRule = this.#activeRules.find((rule: Rule) => rule.isViolated(character));
    if (violatedRule === undefined) {
      return null;
    }
    return violatedRule;
}
```

Recorre todas las reglas activas (con el `.find()` que ya vimos en la sección 5.5) y devuelve la **primera** que este personaje esté violando — o `null` si no viola ninguna, es decir, si el visitante está "limpio".

### 9.3 `Game`: quien manda

`Game` (ver [`Game.ts`](../src/ts/classes/Game.ts)) es la clase más grande e importante del proyecto: es quien conoce el estado completo de la partida (día actual, dinero, errores, visitante en pantalla...) y coordina a todas las demás clases. No dibuja nada en pantalla — de eso se encarga `main.ts` (sección 11) — solo lleva la cuenta y decide las reglas del juego.

Su método más importante es `decide()`:

```ts
decide(accept: boolean, usedAlienStamp: boolean = false, wasRushed: boolean = false): void {
    const currentDay = this.#days[this.#dayNumber - 1];
    const visitor = this.#currentVisitor as Character;
    const violatedRule = currentDay.evaluateCharacter(visitor);
    const shouldReject = violatedRule !== null;

    const wasCorrect = (accept && !shouldReject) || (!accept && shouldReject);

    if (wasCorrect) {
        this.#money += 2;
    } else {
        this.#money -= 5;
        this.#errors += 1;
    }
    // ...
    this.#generateNextVisitor();
}
```

En criollo: "preguntale al día actual si este visitante rompe alguna regla. Si el jugador lo aceptó y no rompía ninguna (o lo rechazó y sí rompía una), acertó: +2 de dinero. Si no, se equivocó: -5 de dinero y un error más. Después, generá el próximo visitante."

Fijate el parámetro `accept: boolean` — es literalmente "¿el jugador decidió aceptarlo?" — y cómo la función combina dos condiciones booleanas con `&&` (Y lógico) y `||` (O lógico): `wasCorrect` es verdadero si ("lo aceptó" **y** "no debía rechazarse") **o** ("lo rechazó" **y** "debía rechazarse").

`Game` también decide cuándo termina la partida:

```ts
isLost(): boolean {
    return this.#errors >= this.#maxErrors;   // 4 errores = derrota
}

isWon(): boolean {
    return this.#dayNumber > this.#totalDays; // pasó el último día = victoria
}
```

### 9.4 `VisitorGenerator`: quien inventa a cada visitante

`VisitorGenerator` (ver [`VisitorGenerator.ts`](../src/ts/classes/VisitorGenerator.ts)) es la clase que, cada vez que hace falta un visitante nuevo, sortea al azar su nombre, su cara, sus rasgos y su pasaporte — decidiendo también, con cierta probabilidad, si va a ser un visitante "limpio" o uno que rompe alguna regla activa. Usa mucho `Math.random()` (que devuelve un número al azar entre 0 y 1) combinado con `Math.floor(...)` (que redondea hacia abajo) para elegir un elemento al azar de una lista:

```ts
const name = this.#names[Math.floor(Math.random() * this.#names.length)];
```

Esto se lee: "de la lista de nombres, elegí uno en una posición al azar". La probabilidad de que un visitante sea "problemático" (rompa una regla) crece con los días, para que el juego se sienta cada vez más difícil.

### 9.5 `Economy`: la calculadora de la tienda y los cobros

`Economy` (ver [`Economy.ts`](../src/ts/classes/Economy.ts)) es una clase pequeña, separada de `Game`, dedicada exclusivamente a los números de dinero que no son "acertar o errar": el cobro fijo de cada día, la penalización por decidir sin revisar el pasaporte, y las tres compras de la tienda (pista, tiempo extra, indulto). Está separada de `Game` para que esta última no crezca todavía más — es un ejemplo de **separación de responsabilidades**: cada clase se ocupa de una sola cosa.

**Para recordar:** `Rule` sabe reconocer UNA infracción. `Day` junta varias reglas y sabe encontrar la primera que se viola. `Game` orquesta la partida completa apoyándose en `Day`, `VisitorGenerator` y `Economy`. Ninguna de estas clases de "reglas del juego" toca la pantalla directamente — eso es tarea de `main.ts`.

---

## 10. El reloj del juego

Cada día del juego dura un tiempo limitado (por ejemplo, 90 segundos), representado en pantalla como un reloj de arena. Esto usa dos herramientas del navegador que vale la pena entender:

- **`setTimeout(función, milisegundos)`**: "ejecutá esta función una sola vez, dentro de tantos milisegundos". Es la base del temporizador del día: cuando arranca un día, [`DayTimer.ts`](../src/ts/classes/DayTimer.ts) programa un `setTimeout` para dentro de, por ejemplo, 90000 milisegundos (90 segundos), que al cumplirse avisa que el día se terminó.
- **`setInterval(función, milisegundos)`**: igual que `setTimeout`, pero **se repite** cada tantos milisegundos, sin parar, hasta que alguien lo cancele explícitamente. Se usa para actualizar el dibujo del reloj de arena cada 200 milisegundos (`CLOCK_TICK_MS`), dando la sensación de movimiento continuo.

```ts
this.#dayTimeoutId = window.setTimeout(() => this.#handleExpire(), durationMs);
this.#clockIntervalId = window.setInterval(() => this.#updateClock(), CLOCK_TICK_MS);
```

Un detalle importante: ambas funciones devuelven un **identificador** (un número), que se guarda (`#dayTimeoutId`, `#clockIntervalId`) para poder **cancelarlas** más adelante con `clearTimeout(id)`/`clearInterval(id)` — por ejemplo, al pausar el juego. Si no se guardara ese identificador, sería imposible "apagar" el reloj después de haberlo encendido.

`DayTimer` también resuelve un problema sutil: si el temporizador del día vence justo en medio de la animación de una decisión (sellar el pasaporte, que tarda casi 2 segundos), no corta esa animación a la mitad — espera a que termine y recién ahí cierra el día. Este tipo de coordinación entre "el tiempo real que pasa" y "lo que el jugador está viendo en pantalla" es uno de los desafíos más comunes al programar juegos, y `markResolving()`/`releaseResolving()` son la solución puntual que usa este proyecto para no mostrarle al jugador dos pantallas de resultado pisándose una a la otra.

**Para recordar:** `setTimeout` = "una vez, más tarde". `setInterval` = "cada tanto, sin parar, hasta que lo cancele". Ambos devuelven un número que hay que guardar para poder cancelarlos después.

---

## 11. La interfaz: cómo `main.ts` conecta todo con la pantalla

Ya vimos las clases que llevan la lógica del juego (`Game`, `Rule`, `Day`...) y ninguna de ellas toca la pantalla. El puente entre esa lógica y lo que el jugador realmente ve y toca es [`main.ts`](../src/ts/main.ts), el archivo más grande del proyecto (más de 1000 líneas). Acá aparecen tres ideas nuevas, fundamentales en cualquier página web interactiva.

### 11.1 El DOM: la pantalla vista como una lista de objetos

El **DOM** (*Document Object Model*) es la forma en que JavaScript "ve" el HTML: cada elemento de la página (`<button>`, `<p>`, `<div>`...) existe como un objeto que se puede leer y modificar desde el código. `document.querySelector("algo")` es la función para **buscar** uno de esos elementos, usando la misma sintaxis que CSS para elegirlos:

```ts
document.querySelector("#new-game-btn")           // el elemento con id="new-game-btn"
document.querySelectorAll(".back-link")           // TODOS los elementos con clase "back-link"
```

`querySelector` devuelve un elemento (o `null` si no existe ninguno); `querySelectorAll` devuelve una lista de todos los que coinciden.

### 11.2 Eventos: reaccionar a lo que hace el jugador

Un **evento** es algo que pasa en la página: un clic, una tecla presionada, el mouse moviéndose. `addEventListener` es la forma de decir "cuando pase este evento en este elemento, ejecutá esta función":

```ts
document.querySelector("#new-game-btn")?.addEventListener("click", () => {
  soundManager.playNextButton();
  changeState("name-entry");
});
```

Esto se lee: "cuando hagan clic en el botón de nueva partida, reproducí el sonido de clic y cambiá de pantalla hacia la de ingresar el nombre". El `?.` antes de `.addEventListener` (llamado *optional chaining*) es una protección: si por algún motivo ese botón no existiera en la página, en vez de romper todo el programa con un error, simplemente no hace nada.

Programar de esta forma —registrar un montón de "cuando pase X, hacé Y" y después dejar que el navegador los vaya disparando en el orden en que el usuario realmente actúa, no en el orden en que están escritos en el archivo— se llama **programación orientada a eventos**, y es como está armada la enorme mayoría de `main.ts`.

### 11.3 Cambiar de pantalla: `changeState`

El juego tiene muchas "pantallas" (menú, opciones, juego, pausa, tienda, resultado del día...), pero todas viven, ya escritas, dentro del mismo `index.html`, cada una en su propio `<section>`. Cambiar de pantalla no es cargar una página nueva: es simplemente ocultar todas las secciones y mostrar solo la que corresponde. Esa es exactamente la función `changeState`:

```ts
function changeState(newState: string): void {
  currentState = newState;
  document.querySelectorAll("section").forEach(section => {
    section.classList.add("hidden");
  });
  document.querySelector(`#${newState}-screen`)?.classList.remove("hidden");
  if (newState === "menu") {
    musicManager.playMenu();
  } else {
    musicManager.stop();
  }
}
```

"Ocultá TODAS las secciones (agregándoles la clase CSS `hidden`, que en `style.css` significa `display: none`), y después mostrá solo la que se llama `#<newState>-screen`". Por ejemplo, `changeState("game")` oculta todo y muestra `#game-screen`. `classList.add`/`classList.remove` son la forma de agregar o quitar una clase CSS a un elemento desde JavaScript — y como el CSS ya define qué aspecto tiene cada clase, cambiar una clase alcanza para cambiar cómo se ve algo, sin que JavaScript tenga que saber nada de colores ni posiciones.

### 11.4 `renderVisitor`: pintar al visitante actual

`renderVisitor()` es la función que, cada vez que hay un visitante nuevo, actualiza absolutamente todo lo que se ve en pantalla para reflejarlo: su cara, ojos, cuernos (si tiene), los datos de su pasaporte, la frase que dice, el contador de día/errores/dinero. El patrón se repite una y otra vez:

```ts
const faceEl = document.querySelector(".part-face");
if (faceEl !== null) faceEl.className = "part part-face " + visitor.obtainFace;
```

"Buscá el elemento de la cara; si existe, cambiale la clase CSS para que muestre la imagen que corresponde a la cara de ESTE visitante." `visitor.obtainFace` es justamente uno de esos getters que vimos en la sección 6 — `main.ts` nunca toca directamente ningún campo privado de `Character`, siempre pasa por sus getters.

**Para recordar:** el DOM es "la pantalla vista como objetos". Los eventos + `addEventListener` son la forma de reaccionar a lo que hace el jugador. `changeState` no carga páginas nuevas: solo esconde y muestra secciones ya existentes con clases CSS.

---

## 12. Animaciones: dar la sensación de movimiento

Todo lo que se "mueve" en pantalla (el personaje entrando y saliendo, el pasaporte volando en arco, la moneda girando) se resuelve con una combinación de CSS y JavaScript. Tres ejemplos, de más simple a más complejo.

### 12.1 La moneda que gira: cambiar de imagen a intervalos

[`coinSpin.ts`](../src/ts/coinSpin.ts) hace algo muy simple: cada 120 milisegundos, cambia la clase CSS de la moneda a la siguiente de una lista de 6 "cuadros" (como los fotogramas de un dibujo animado):

```ts
const COIN_SPIN_FRAMES = ["moneda-1", "moneda-2", "moneda-3", "moneda-4", "moneda-3", "moneda-2"];

let index = 0;
window.setInterval(() => {
  index = (index + 1) % COIN_SPIN_FRAMES.length;
  coinEl.className = COIN_SPIN_FRAMES[index];
}, 120);
```

El operador `%` (llamado **módulo**, o "resto de la división") es el truco clásico para "dar la vuelta" en un ciclo: cuando `index` llega a 6 (el largo de la lista), `6 % 6` da `0`, así que vuelve al principio en vez de salirse de la lista. Es la misma idea que usan las agujas de un reloj al pasar de las 12 a la 1.

### 12.2 El personaje deslizándose: transiciones CSS

Cuando el personaje entra o sale de escena, `main.ts`/`characterSlide.ts` no calculan el movimiento cuadro por cuadro — solo cambian la posición final (la propiedad `left` en `%`) y dejan que **CSS** anime la transición entre el valor viejo y el nuevo, con una `transition` ya definida en `style.css`. Es más simple y más eficiente: JavaScript decide *a dónde* tiene que llegar cada cosa, y el navegador se encarga de *cómo* llegar ahí suavemente.

### 12.3 El pasaporte en arco: curvas de Bézier

El vuelo del pasaporte (saliendo del personaje, pasando por arriba, cayendo sobre el escritorio) es más complejo: no es solo "de un punto a otro en línea recta" como el personaje, sino una **curva**. Para lograrlo, [`bezierArc.ts`](../src/ts/bezierArc.ts) calcula, muchas veces por segundo, la posición exacta del pasaporte a lo largo de una curva matemática llamada **curva de Bézier** (la misma familia de curvas que usa el CSS para las transiciones "suaves").

Esto usa una herramienta del navegador llamada **`requestAnimationFrame`**, que es distinta de `setInterval`: en vez de decir "cada tantos milisegundos", le pide al navegador "avisame la próxima vez que vayas a redibujar la pantalla" (normalmente 60 veces por segundo). Es la forma correcta de animar algo cuadro por cuadro sin generar movimientos entrecortados:

```ts
function step(now: number): void {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const t = easing(progress);
    // ... calcular "left" y "top" según t, y aplicarlos al elemento ...
    if (progress < 1) {
      window.requestAnimationFrame(step);  // pedí el próximo cuadro
    } else {
      onFinish();  // ya llegó, avisar que terminó
    }
}
window.requestAnimationFrame(step);
```

`progress` va de `0` (recién empieza) a `1` (ya llegó), calculado a partir de cuánto tiempo real pasó desde el inicio (`now - startTime`) comparado contra la duración total (`durationMs`). En cada cuadro, la función se vuelve a llamar a sí misma (esto se llama **recursión**: una función que se invoca a sí misma) hasta que `progress` llega a `1`, momento en el que avisa que terminó llamando a `onFinish()` — una función que le pasaron por parámetro (ver "funciones que reciben funciones" más abajo).

### Un concepto extra: funciones que reciben otras funciones

Ya vimos algo parecido en `.find()`/`.map()` (sección 5.5), pero acá aparece con más claridad: `animatePassportAlongArc(..., onFinish)` recibe **una función completa** como uno de sus parámetros, para poder ejecutarla justo cuando la animación termine. Esto es extremadamente común en JavaScript, porque muchas cosas (animaciones, temporizadores, pedidos de red) no terminan "ya", sino "en algún momento futuro" — y la única forma de decir "hacé esto cuando eso pase" es entregarle una función que se ejecute en ese momento. A esa función que se pasa para ser ejecutada más tarde se la suele llamar **callback**.

**Para recordar:** las animaciones simples (posición final) se le delegan a CSS con `transition`. Las animaciones que necesitan una trayectoria curva se calculan cuadro por cuadro con `requestAnimationFrame`, usando "callbacks" para avisar cuándo terminan.

---

## 13. El sonido: `SoundManager` y `MusicManager`

El navegador tiene un objeto llamado `Audio` para reproducir sonidos. [`SoundManager.ts`](../src/ts/classes/SoundManager.ts) guarda uno por cada efecto (`stamp.mp3`, `wrong.wav`...) y expone métodos con nombres claros (`playAccept()`, `playWrong()`) para que `main.ts` nunca tenga que preocuparse por nombres de archivo.

Un detalle interesante:

```ts
#playClone(sound: HTMLAudioElement): void {
    if (this.#volume === 0) {
      return;
    }
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = this.#volume;
    clone.play().catch(() => {});
}
```

¿Por qué **clonar** (`cloneNode()`) el sonido en vez de reproducir el original directamente? Porque si el jugador sella dos pasaportes muy rápido, uno después del otro, el mismo `Audio` no puede reproducirse dos veces superpuesto — la segunda vez interrumpiría a la primera. Clonándolo, cada sonido nuevo es un `Audio` independiente que puede sonar al mismo tiempo que el anterior sin pisarlo. `clone.play().catch(() => {})` es, de nuevo, la protección de "si por algún motivo el navegador bloquea la reproducción, no rompas el programa, simplemente ignoralo silenciosamente".

`MusicManager.ts` es más simple: solo controla la música de fondo del menú, en loop (`#menuMusic.loop = true`), y se detiene apenas se cambia a cualquier otra pantalla (ver `changeState` en la sección 11.3).

---

## 14. El recorrido completo de una partida

Ahora que conocemos todas las piezas, podemos seguir el hilo completo de lo que pasa cuando alguien juega, de punta a punta:

1. Se abre `index.html`. `main.ts` se ejecuta de arriba a abajo una vez: registra todos los `addEventListener`, actualiza el botón "Continuar" según si hay una partida guardada, dibuja el historial, y arranca a precargar imágenes.
2. El jugador hace clic en **"Nueva partida"** → `changeState("name-entry")` muestra el formulario de nombre.
3. Al enviar el formulario: se crea un `Game` nuevo (`new Game(nombre, totalDays)`), que dispara `game.loadData(...)` — los 7 `fetch` de la sección 7 — y recién cuando todos terminan, arranca la partida (`game.startNewGame()`) y se muestra la introducción narrativa.
4. `game.startNewGame()` llama internamente a `#startDay()`, que resetea los contadores del día y genera el primer visitante con `VisitorGenerator`.
5. `renderVisitor()` (sección 11.4) pinta a ese visitante en pantalla: cara, pasaporte cerrado, y lo anima llegando con `animatePassportAlongArc`.
6. El jugador hace clic en el pasaporte para abrirlo (`stampDrag.ts`), y después arrastra un sello (verde = aceptar, rojo = rechazar, azul = aprobar alien) hasta soltarlo cerca del pasaporte.
7. Soltar el sello dispara `resolveDecision(accept, usedAlienStamp)`, que anima el cierre y la devolución del pasaporte y, al terminar esa animación (¡otro callback!), llama a `game.decide(...)` — el método de la sección 9.3 que compara la decisión contra las reglas activas y ajusta dinero/errores.
8. Si `game.isLost()` es verdadero, la partida termina ahí mismo: se guarda el resultado en el historial (`Storage.ts`) y se muestra la pantalla final. Si no, se genera el próximo visitante y se repite desde el paso 5 — o, si se acabó el tiempo del día, se cierra el día (`game.endDay()`), se muestra el resumen del día (sección de estadísticas), y arranca un día nuevo con más reglas activas.
9. Al llegar al último día sin perder, `game.isWon()` se vuelve verdadero: se guarda la victoria en el historial y `renderFinalScreen()` elige, según el dinero final, los errores acumulados y las rachas de victorias/derrotas consecutivas guardadas en `localStorage`, cuál de los varios finales posibles mostrar (sección `ENDING_*` de `main.ts`), seguido de los premios que se hayan ganado.

Todo el tiempo, en paralelo, `DayTimer` corre en segundo plano (sección 10) y puede terminar el día por sí solo si se acaba el tiempo, sin que el jugador termine de decidir sobre el visitante actual.

---

## 15. Glosario

- **Array**: una lista ordenada de valores.
- **Callback**: una función que se le pasa a otra para que la ejecute más adelante, típicamente cuando algo asincrónico termina.
- **Clase**: el "molde" que describe qué datos y comportamientos va a tener cada objeto creado con él.
- **Compilar**: traducir código de un lenguaje a otro (acá, de TypeScript a JavaScript) antes de poder ejecutarlo.
- **Constructor**: la función especial de una clase que se ejecuta al crear (`new`) una instancia nueva.
- **DOM**: la representación del HTML de una página como objetos que JavaScript puede leer y modificar.
- **Encapsulamiento**: ocultar los datos internos de un objeto (campos privados, `#`) detrás de una interfaz controlada (getters/métodos).
- **Evento**: algo que ocurre en la página (clic, tecla, etc.) al que el código puede reaccionar con `addEventListener`.
- **Getter**: un método que permite leer un dato privado desde afuera de la clase, sin exponer el campo directamente.
- **Herencia (`extends`/`super`)**: una clase que reutiliza los datos y comportamientos de otra, agregando o ajustando solo lo que le es propio.
- **Instancia**: un objeto concreto, creado a partir de una clase con `new`.
- **JSON**: un formato de texto para representar datos (objetos, listas, números, texto) sin ninguna lógica.
- **`localStorage`**: espacio de almacenamiento de texto del navegador que sobrevive a cerrar la pestaña.
- **Método**: una función que pertenece a una clase (y por lo tanto puede usar `this` y los campos privados del objeto).
- **Parámetro**: un dato que una función recibe para poder trabajar con él.
- **Promesa (`Promise`)**: un objeto que representa un resultado que todavía no está listo, pero lo va a estar en el futuro (por ejemplo, el resultado de un `fetch`).
- **`this`**: dentro de un método, hace referencia al objeto concreto sobre el que se está ejecutando ese método.
- **TypeScript**: JavaScript con un sistema de tipos agregado, que se traduce ("compila") a JavaScript antes de correr en el navegador.
- **Variable**: un espacio con nombre donde se guarda un valor que puede leerse (y a veces cambiarse) más adelante.

---

*Este documento describe el código tal como está en el repositorio al momento de escribirlo. Si el código cambia (nuevas clases, archivos que se dividen, convenciones nuevas), lo más confiable siempre va a ser volver a leer el archivo fuente citado en cada sección — este texto es una guía para entenderlo, no un reemplazo de él.*
