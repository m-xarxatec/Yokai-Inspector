# AGENTE DE ANÁLISIS Y DOCUMENTACIÓN — YOKAI INSPECTOR

## 1. Objetivo

Analiza de forma exhaustiva el repositorio:

**Repositorio:** `https://github.com/m-xarxatec/Yokai-Inspector/tree/develop`  
**Rama objetivo:** `develop`

El resultado debe ser un documento técnico y didáctico dirigido a un **programador junior** que necesita entender el proyecto desde cero, no solamente un resumen.

El análisis debe explicar:

1. Qué hace el juego completo.
2. Cómo está organizado el repositorio.
3. Cómo empieza la aplicación en `HTML`.
4. Cómo el `HTML` se relaciona con CSS, JavaScript compilado y TypeScript.
5. Cómo se crean y manipulan los personajes.
6. Cómo funcionan las clases de POO.
7. Cómo se generan y aplican las reglas.
8. Cómo el juego determina si un visitante cumple o incumple una regla.
9. Cómo las **imágenes del personaje** representan características que posteriormente son interpretadas por TypeScript.
10. Cómo se decide si una característica visual implica una infracción.
11. Cómo funcionan los sellos ACEPTAR/RECHAZAR.
12. Cómo funciona el pasaporte.
13. Cómo funciona el tiempo, los días, los errores, el dinero y las rachas.
14. Cómo funciona `localStorage`.
15. Qué papel tiene cada archivo.
16. Qué funcionalidades ya están implementadas.
17. Qué funcionalidades parecen incompletas, provisionales o preparadas para el futuro.
18. Qué aportó específicamente **Iralys**, utilizando evidencia del repositorio y del historial Git, sin atribuir código por suposición.
19. Qué podría mejorar o añadirse para aportar valor real al juego.
20. Qué mejoras son compatibles con las restricciones del proyecto y cuáles NO deben proponerse.

---

# 2. Regla principal del análisis

**NO INVENTAR.**

Todo comportamiento debe comprobarse directamente en el código.

Para cada funcionalidad importante:

- indicar el archivo;
- indicar la función, clase, método o bloque responsable;
- indicar las líneas aproximadas o exactas cuando sea posible;
- explicar qué recibe;
- explicar qué modifica;
- explicar qué devuelve;
- explicar qué elemento de la interfaz afecta;
- explicar qué ocurre después.

Si una conclusión no puede comprobarse, escribir:

> "No se puede confirmar con el código disponible."

No presentar como implementado algo que solamente aparezca mencionado en comentarios, README, `docs/ideas.md` o nombres de variables.

Diferenciar siempre:

- **Implementado**
- **Parcialmente implementado**
- **Preparado pero no utilizado**
- **Mencionado como idea futura**
- **No implementado**

---

# 3. Restricciones que deben respetarse

El README de `develop` establece que el proyecto:

- es un juego web inspirado en *Papers, Please*;
- utiliza conceptos vistos en clase;
- debe utilizar **Vanilla JS**;
- no debe incorporar dependencias externas;
- utiliza `localStorage`;
- se ejecuta localmente;
- no utiliza backend complejo;
- no utiliza servidores externos o nube.

Por tanto, cualquier propuesta de mejora debe clasificarse:

### Compatible

Puede implementarse utilizando:

- HTML;
- CSS;
- JavaScript/TypeScript;
- DOM;
- clases;
- arrays;
- objetos;
- funciones;
- eventos;
- `localStorage`;
- JSON;
- imágenes ya disponibles o nuevas imágenes estáticas;
- APIs nativas del navegador solamente si no contradicen las reglas del proyecto.

### No compatible

No proponer como solución principal:

- React;
- Vue;
- Angular;
- Phaser;
- Three.js;
- Firebase;
- Supabase;
- Node.js como backend;
- bases de datos externas;
- APIs externas;
- librerías de terceros;
- servicios cloud;
- IA externa;
- OCR externo;
- frameworks que contradigan el requisito de Vanilla JS.

Si alguna tecnología externa se menciona, debe aparecer solamente en una sección llamada **"Qué NO debemos añadir y por qué"**.

---

# 4. Primera fase: inventario completo del repositorio

Recorrer todo el repositorio `develop`.

Crear una tabla con:

| Ruta | Tipo | Responsabilidad | Estado | Dependencias internas |
|---|---|---|---|---|

Como mínimo revisar:

- `README.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `public/index.html`
- `public/js/`
- `public/styles/`
- `public/img/`
- `public/data/`
- `src/ts/main.ts`
- `src/ts/Storage.ts`
- `src/ts/classes/`
- documentación existente en `docs/`
- configuración del proyecto
- cualquier otro archivo que participe en la ejecución.

No limitar el análisis a los archivos TypeScript.

---

# 5. Segunda fase: reconstruir el flujo de ejecución

Explicar el recorrido completo:

```text
index.html
   ↓
estructura de pantallas
   ↓
CSS
   ↓
JavaScript generado
   ↓
main.ts
   ↓
event listeners
   ↓
Game / Day / Character
   ↓
Human / Yokai
   ↓
Passport
   ↓
Rule
   ↓
comprobación de reglas
   ↓
decisión del jugador
   ↓
resultado
   ↓
dinero / errores / racha / día
   ↓
localStorage
```

No asumir que este diagrama es exacto. Corregirlo según el código real.

---

# 6. Explicación HTML → CSS → TypeScript

Explicar primero el `index.html`.

Para cada pantalla importante:

- localizar el `<section>`;
- identificar su `id`;
- explicar para qué sirve;
- explicar cuándo se muestra;
- explicar cuándo se oculta;
- identificar los elementos que TypeScript modifica.

Ejemplos de elementos que deben investigarse:

- menú;
- entrada del nombre;
- historia;
- pantalla de juego;
- pasaporte;
- personaje;
- HUD;
- contador de día;
- contador de errores;
- dinero;
- reloj;
- sellos;
- diálogo;
- reacciones de las jefas;
- créditos;
- historial;
- opciones;
- pantalla final.

Después explicar:

```text
HTML = estructura
CSS = apariencia
TypeScript = comportamiento
localStorage = persistencia
```

Pero no quedarse en esta definición general.

Mostrar ejemplos concretos del repositorio.

---

# 7. Explicación específica de las imágenes

Esta es una de las partes más importantes del análisis.

El documento debe responder claramente:

> **¿Cómo sabe el juego, a partir de una imagen, si un personaje cumple o incumple una regla?**

Debe explicarse sin confundir dos conceptos.

## 7.1 El juego NO está haciendo reconocimiento de imágenes

Comprobar en el código si el juego realmente utiliza visión artificial, OCR o análisis de píxeles.

Si no existe ese mecanismo, explicar claramente:

> El juego no mira la imagen y descubre automáticamente la característica. La imagen representa visualmente un estado que ya fue definido previamente en los datos y en los objetos TypeScript.

Explicar la diferencia entre:

```text
imagen → reconocimiento automático
```

y:

```text
datos del personaje → estado booleano → imagen correspondiente
```

## 7.2 Seguir una característica visual de principio a fin

Realizar ejemplos concretos.

### Ejemplo: cuernos

Seguir todo el flujo:

```text
tipo de Yokai
   ↓
Yokai.ts
   ↓
haveHorns = true/false
   ↓
Character
   ↓
renderizado visual
   ↓
part-horns / imagen correspondiente
   ↓
Rule
   ↓
tieneCuernos
   ↓
comparación con forbiddenValue
   ↓
violación o no violación
```

Explicar exactamente qué código hace cada paso.

### Ejemplo: ojos amarillos

Repetir el análisis:

```text
yokaiType
   ↓
yellowEyes
   ↓
Character
   ↓
renderizado
   ↓
Rule.isViolated()
```

### Ejemplo: especie declarada vs especie aparente

Explicar especialmente `specieLiar()`.

La documentación debe mostrar:

- qué dice el pasaporte;
- qué características visuales permiten deducir la especie;
- cómo el código deduce la especie aparente;
- cómo compara ambos valores;
- cómo eso se convierte en una regla;
- cuándo se considera que el visitante mintió.

---

# 8. Explicar la arquitectura de POO

Analizar todas las clases.

Como mínimo:

- `Character`
- `Human`
- `Yokai`
- `Passport`
- `Rule`
- `Game`
- `Day`

Crear un apartado para cada clase:

### Nombre de la clase

**Responsabilidad:**

**Propiedades:**

**Métodos:**

**Quién la instancia:**

**Quién la utiliza:**

**Qué información recibe:**

**Qué información produce:**

**Relaciones con otras clases:**

**Ejemplo práctico:**

Explicar también:

- herencia;
- encapsulación;
- getters;
- constructores;
- métodos;
- `private` / campos `#`;
- polimorfismo si realmente existe.

---

# 9. Clase `Character`

Explicar `Character` como base de los personajes.

Mostrar cómo se relacionan:

```text
Character
   ├── Human
   └── Yokai
```

Explicar qué datos pertenecen a todos los personajes y cuáles solamente a los Yokai.

---

# 10. Clase `Yokai`

Explicar exactamente cómo determina:

- tipo de Yokai;
- cuernos;
- ojos amarillos;
- especie aparente;
- apariencia visual;
- relación con `Passport`.

Especial atención a:

```ts
if (yokaiType === "oni") ...
if (yokaiType === "kitsune") ...
```

No copiar grandes cantidades de código. Utilizar fragmentos cortos y explicarlos línea por línea.

---

# 11. Clase `Passport`

Explicar:

- nombre;
- región;
- especie declarada;
- sello.

Explicar que el pasaporte representa datos declarados por el visitante y que no necesariamente coinciden con sus características reales.

Mostrar cómo `Rule` utiliza esos datos.

---

# 12. Clase `Rule`

Esta sección debe ser especialmente detallada.

Explicar:

```ts
isViolated(character: Character)
```

Analizar cada `case`.

Como mínimo:

- `tieneCuernos`
- `ojosAmarillos`
- `region`
- `sello`
- `mintioSobreEspecie`

Explicar con ejemplos:

```text
Regla:
"Está prohibido entrar a los Oni"

Personaje:
es Oni

Resultado:
violación = true
```

Después explicar el caso inverso.

Mostrar por qué el juego utiliza:

```ts
character.obtainHaveHorns === this.#forbiddenValue
```

y qué significa `forbiddenValue`.

---

# 13. Explicar cómo una regla termina convirtiéndose en una decisión

Reconstruir este flujo:

```text
Regla del día
      ↓
datos del personaje
      ↓
Rule.isViolated()
      ↓
true / false
      ↓
comparación con decisión del jugador
      ↓
acierto / error
      ↓
dinero / errores / racha
      ↓
reacción de la Jefa
```

Explicar también qué sucede cuando:

- se rechaza correctamente;
- se acepta correctamente;
- se acepta un personaje prohibido;
- se rechaza un personaje permitido.

---

# 14. Explicar `main.ts`

`main.ts` debe analizarse por bloques funcionales y NO como una lista interminable de líneas.

Separar por responsabilidades:

1. imports;
2. referencias al DOM;
3. configuración;
4. estado global;
5. creación de visitantes;
6. renderizado;
7. pasaporte;
8. sellos;
9. decisiones;
10. animaciones;
11. reloj;
12. días;
13. errores;
14. dinero;
15. jefas;
16. pantallas;
17. historial;
18. persistencia;
19. eventos.

Para cada bloque:

- qué problema resuelve;
- qué variables utiliza;
- qué funciones intervienen;
- qué elemento visual modifica.

---

# 15. Explicar el flujo del juego como si se depurara

Crear un ejemplo completo.

Por ejemplo:

> El visitante aparece en pantalla.

Explicar exactamente:

1. qué función se ejecuta;
2. qué objeto representa al visitante;
3. cómo se seleccionan sus datos;
4. cómo se seleccionan las imágenes;
5. cómo se muestran;
6. cómo aparece el pasaporte;
7. cómo se cargan las reglas del día;
8. cómo el jugador analiza al visitante;
9. cómo se ejecuta la decisión;
10. cómo se comprueba la regla;
11. cómo se calcula el resultado;
12. cómo cambia el dinero;
13. cómo cambia el contador de errores;
14. cómo cambia la racha;
15. cómo reacciona la Jefa;
16. cómo se pasa al siguiente visitante.

---

# 16. Explicar el sistema de imágenes

Revisar:

- `public/img/`;
- nombres de archivos;
- carpetas;
- sprites;
- imágenes de personajes;
- partes del cuerpo;
- fondos;
- jefas;
- pasaportes;
- sellos;
- animaciones.

Determinar si el proyecto utiliza:

- una imagen completa por personaje;
- composición por capas;
- clases CSS;
- `background-image`;
- elementos HTML;
- sprites;
- animaciones;
- cambios de `className`;
- cambios de `style`;
- selección de imágenes mediante TypeScript.

Explicar la cadena real.

---

# 17. Explicar la composición visual del personaje

Investigar específicamente elementos como:

```html
<div id="character-portrait">
    <div class="part part-face"></div>
    <div class="part part-eyes"></div>
    <div class="part part-mouth"></div>
    <div class="part part-horns"></div>
    <div class="part part-hair"></div>
</div>
```

Explicar cómo cada parte visual se relaciona con los datos del personaje.

Si existen clases CSS que cambian la imagen, mostrar el flujo:

```text
dato TypeScript
   ↓
clase CSS / atributo / estilo
   ↓
imagen
   ↓
resultado visual
```

---

# 18. Explicar `localStorage`

Analizar `Storage.ts`.

Explicar:

- `saveCurrentGame`
- `loadCurrentGame`
- `deleteCurrentGame`
- `saveToHistory`
- `getHistory`
- `savePlayerName`
- `loadPlayerName`
- `addCredits`
- `getAllCredits`
- `saveDayStreaks`
- `loadDayStreaks`

Explicar:

```text
Objeto JavaScript
   ↓
JSON.stringify()
   ↓
localStorage
```

y:

```text
localStorage
   ↓
JSON.parse()
   ↓
Objeto JavaScript
```

Explicar qué se conserva al cerrar el navegador.

---

# 19. Explicar JSON y datos

Buscar archivos JSON o estructuras equivalentes.

Explicar:

- qué datos contienen;
- quién los carga;
- quién los transforma;
- quién los utiliza;
- por qué se utiliza JSON;
- qué ocurriría si se cambia un dato.

Crear al menos un ejemplo real del repositorio.

---

# 20. Análisis de las Jefas y de Iralys

Esta sección es obligatoria.

## 20.1 Identificar a Iralys correctamente

No atribuir funcionalidades simplemente porque README diga "Iralys y Mike".

Investigar:

- commits;
- autores;
- historial de archivos;
- cambios asociados;
- funciones creadas/modificadas;
- documentación;
- imágenes;
- lógica;
- UI.

Si GitHub permite identificar autoría, utilizar evidencia del historial.

Clasificar las aportaciones de Iralys:

### Código

Archivos y funciones.

### Diseño

Pantallas, UI, composición, interacción.

### Arte

Imágenes, personajes, jefas, fondos, elementos visuales.

### Lógica

Reglas, decisiones, juego, persistencia, flujo.

### Documentación

README, diarios, ideas, comentarios.

### Mantenimiento

Correcciones, refactors, mejoras.

Si no puede determinarse la autoría de una parte:

> "Autoría no verificable con la información disponible."

---

# 21. Explicar muy bien el sistema de Jefas

Analizar cómo aparecen las Jefas después de una decisión.

Explicar:

- cuándo aparece una Jefa;
- qué Jefa aparece;
- qué condición determina su aparición;
- qué información recibe;
- cómo se muestra su imagen;
- cómo aparece el diálogo;
- qué ocurre cuando el jugador se equivoca;
- qué ocurre cuando acierta;
- cómo se pausa el temporizador;
- cómo se reanuda;
- cómo se continúa la partida.

Analizar especialmente las funciones relacionadas con:

- `showErrorReaction`;
- pausa/reanudación del día;
- selección de Jefa;
- diálogos;
- resultados.

No asumir que el nombre de una función implica exactamente ese comportamiento: comprobar el código.

---

# 22. Mejoras para las Jefas

Proponer mejoras que respeten Vanilla JS y `localStorage`.

Cada propuesta debe tener:

**Nombre**

**Problema actual**

**Valor para el jugador**

**Cómo funcionaría**

**Archivos que habría que modificar**

**Clases/funciones afectadas**

**Datos nuevos necesarios**

**Complejidad:** Baja / Media / Alta

**Compatible con README:** Sí / No

Priorizar mejoras que:

- aumenten la narrativa;
- hagan que las decisiones tengan consecuencias;
- aumenten la rejugabilidad;
- utilicen el sistema existente;
- no requieran backend;
- no introduzcan dependencias.

---

# 23. Mejoras de valor para el juego

Proponer únicamente mejoras que encajen con la filosofía actual.

Ejemplos que deben evaluarse, no asumirse como implementables:

### Sistema de reputación

La actuación del inspector afecta su reputación.

### Consecuencias acumulativas

Las decisiones de días anteriores pueden modificar diálogos o eventos.

### Reglas combinadas

Ejemplo:

```text
Si es Oni Y pertenece a determinada región:
rechazar.
```

### Reglas contradictorias

Crear situaciones en las que el jugador deba interpretar correctamente qué regla tiene prioridad.

### Eventos especiales

Un visitante excepcional que genere una situación narrativa.

### Finales alternativos

Utilizar las rachas ya guardadas si realmente encaja con el código existente.

### Historial ampliado

Mostrar estadísticas de la partida.

### Tutorial interactivo

Introducir progresivamente:

- pasaporte;
- características;
- reglas;
- sellos;
- errores.

### Dificultad progresiva

Aumentar el número o complejidad de reglas.

### Decisiones con consecuencias

No limitar el resultado a "ganaste/perdiste".

Cada propuesta debe comprobar primero si puede realizarse con las tecnologías permitidas.

---

# 24. Qué mejoras NO hacer

Crear una lista de propuestas que parezcan atractivas pero contradigan el proyecto.

Ejemplos:

- convertir el juego a React;
- usar Phaser;
- introducir una base de datos;
- crear backend;
- usar Firebase;
- añadir una API externa;
- añadir OCR;
- usar visión artificial;
- añadir un sistema de usuarios online.

Explicar por qué perjudicarían el objetivo académico del proyecto.

---

# 25. Problemas y deuda técnica

Detectar:

- funciones demasiado grandes;
- responsabilidades mezcladas;
- nombres poco claros;
- tipos `any`;
- duplicación;
- estado global excesivo;
- acoplamiento DOM/lógica;
- comentarios desactualizados;
- código muerto;
- variables preparadas para funciones futuras;
- posibles errores;
- posibles condiciones de carrera;
- problemas de mantenimiento.

No modificar nada.

Primero explicar:

```text
Problema
→ causa
→ impacto
→ solución propuesta
```

---

# 26. Nivel de explicación

El documento final debe ser comprensible para alguien que:

- conoce HTML básico;
- conoce CSS básico;
- está aprendiendo JavaScript;
- está empezando TypeScript;
- conoce variables, funciones, arrays y objetos;
- todavía tiene dificultades entendiendo POO;
- no domina DOM;
- no comprende completamente `localStorage`.

Cuando aparezca algo complejo, explicar primero con lenguaje sencillo y después con lenguaje técnico.

Ejemplo:

> En términos sencillos: el objeto `Rule` representa una regla del día.

Después:

> Técnicamente: `Rule` encapsula el día, la propiedad evaluada, el valor prohibido y la descripción, y expone `isViolated()` para evaluar un `Character`.

---

# 27. No limitarse a copiar código

No generar cientos de líneas copiadas.

Utilizar fragmentos pequeños:

```ts
case "tieneCuernos":
    return character.obtainHaveHorns === this.#forbiddenValue;
```

Después explicar:

- `case` selecciona la propiedad;
- `character.obtainHaveHorns` obtiene el estado del personaje;
- `forbiddenValue` contiene el valor que la regla considera prohibido;
- `===` compara;
- el resultado es `true` o `false`.

---

# 28. Crear ejemplos de ejecución

El documento final debe incluir varios escenarios.

## Caso A — personaje permitido

Mostrar:

```text
Datos del personaje
→ reglas
→ comprobación
→ decisión
→ resultado
```

## Caso B — personaje prohibido

Mismo análisis.

## Caso C — personaje que miente sobre su especie

Explicar especialmente `specieLiar()`.

## Caso D — error del jugador

Mostrar qué cambia en:

- errores;
- dinero;
- racha;
- Jefa;
- temporizador;
- siguiente visitante.

---

# 29. Mapa mental final

Crear un mapa conceptual textual:

```text
Juego
├── Interfaz
│   ├── HTML
│   ├── CSS
│   └── imágenes
│
├── Lógica
│   ├── main.ts
│   ├── Game
│   ├── Day
│   ├── Character
│   ├── Human
│   └── Yokai
│
├── Reglas
│   └── Rule
│
├── Documentación del visitante
│   └── Passport
│
└── Persistencia
    └── Storage.ts
```

Modificarlo según la arquitectura real.

---

# 30. Tabla final de funcionalidades

Crear una tabla:

| Funcionalidad | Archivo principal | Estado | Cómo funciona | Posible mejora |
|---|---|---|---|---|
| Inicio | | | | |
| Nombre | | | | |
| Historia | | | | |
| Visitantes | | | | |
| Pasaporte | | | | |
| Reglas | | | | |
| Sellos | | | | |
| Decisión | | | | |
| Errores | | | | |
| Dinero | | | | |
| Rachas | | | | |
| Días | | | | |
| Temporizador | | | | |
| Jefas | | | | |
| Historial | | | | |
| Créditos | | | | |
| Persistencia | | | | |

---

# 31. Checklist de cumplimiento

Antes de finalizar el análisis:

- [ ] Se revisó `README.md`.
- [ ] Se revisó `index.html`.
- [ ] Se revisó `main.ts`.
- [ ] Se revisó `Storage.ts`.
- [ ] Se revisaron todas las clases.
- [ ] Se revisaron los datos.
- [ ] Se revisaron las imágenes.
- [ ] Se revisaron los estilos.
- [ ] Se reconstruyó el flujo completo.
- [ ] Se explicó HTML → CSS → TypeScript.
- [ ] Se explicó cómo las imágenes representan estados.
- [ ] Se explicó por qué el juego puede determinar una infracción.
- [ ] Se explicó `Rule.isViolated()`.
- [ ] Se explicó `specieLiar()`.
- [ ] Se explicó `localStorage`.
- [ ] Se explicó el sistema de Jefas.
- [ ] Se investigó la contribución de Iralys.
- [ ] Se separó autoría comprobada de autoría no comprobable.
- [ ] Se propusieron mejoras compatibles con Vanilla JS.
- [ ] Se identificaron mejoras que contradicen el README.
- [ ] Se identificó deuda técnica.
- [ ] Se utilizaron ejemplos reales del código.
- [ ] No se inventaron funcionalidades.

---

# 32. Formato del documento final

El resultado debe ser un documento largo, estructurado y pedagógico.

Orden obligatorio:

1. Portada
2. Estado del repositorio analizado
3. Reglas y restricciones del proyecto
4. Arquitectura general
5. Estructura de carpetas
6. HTML
7. CSS
8. TypeScript
9. Flujo de ejecución
10. POO
11. Character
12. Human
13. Yokai
14. Passport
15. Rule
16. Game
17. Day
18. Sistema de imágenes
19. Cómo las imágenes representan características
20. Cómo se determina una infracción
21. Sistema de decisiones
22. Sellos
23. Tiempo y días
24. Errores
25. Dinero
26. Rachas
27. Jefas
28. localStorage
29. JSON/datos
30. Contribución de Iralys
31. Evaluación de la contribución de Iralys
32. Mejoras posibles para Iralys
33. Mejoras generales del juego
34. Deuda técnica
35. Qué NO modificar
36. Plan de mejoras por prioridad
37. Ejemplos completos de ejecución
38. Mapa mental
39. Tabla final de funcionalidades
40. Checklist final
41. Conclusión técnica

---

# 33. Plan de mejora recomendado

Al final, clasificar las propuestas:

### Prioridad 1 — Correcciones

Problemas que pueden provocar errores o confusión.

### Prioridad 2 — Mejoras de arquitectura

Cambios que faciliten mantenimiento sin alterar la tecnología.

### Prioridad 3 — Mejoras de gameplay

Cambios que hagan el juego más interesante.

### Prioridad 4 — Mejoras narrativas

Cambios relacionados con las Jefas, historia y consecuencias.

### Prioridad 5 — Mejoras visuales

Cambios de interfaz, animaciones o feedback.

Cada propuesta debe indicar si puede implementarse manteniendo:

> Vanilla JS + TypeScript + HTML + CSS + localStorage + ejecución local.

---

# 34. Criterio especial para Iralys

La sección de Iralys debe ser especialmente útil para aprender.

No limitarse a:

> "Iralys hizo X."

Explicar:

```text
Qué problema había
        ↓
Qué solución implementó
        ↓
En qué archivo
        ↓
Qué función/clase participa
        ↓
Cómo funciona
        ↓
Qué ve el jugador
        ↓
Qué podría mejorarse
```

Si una funcionalidad creada por Iralys tiene una oportunidad de mejora, explicar exactamente cómo evolucionarla sin romper el diseño actual.

---

# 35. Resultado esperado

El documento debe permitir que un programador junior pueda abrir el repositorio y responder por sí mismo:

- ¿Dónde empieza el juego?
- ¿Cómo pasa del HTML al TypeScript?
- ¿Cómo se crea un personaje?
- ¿Cómo se sabe que tiene cuernos?
- ¿Cómo esa información termina apareciendo como imagen?
- ¿Cómo sabe `Rule` que los cuernos están prohibidos?
- ¿Cómo se determina si el jugador acertó?
- ¿Cómo se guarda la partida?
- ¿Cómo funcionan los días?
- ¿Cómo funcionan las Jefas?
- ¿Qué hizo Iralys?
- ¿Qué partes puede modificar sin romper el proyecto?
- ¿Qué nuevas funcionalidades puede añadir respetando el README?

El objetivo no es solamente documentar el código.

El objetivo es **enseñar a entender el proyecto completo y su flujo de datos a un programador junior**, utilizando el repositorio real como material de estudio.

---

## Fuente de verdad

Repositorio analizado:

`https://github.com/m-xarxatec/Yokai-Inspector/tree/develop`

Analizar siempre la rama `develop`, salvo que el usuario indique expresamente otra rama.

Si el repositorio cambia, volver a analizar el estado actual antes de afirmar que una funcionalidad sigue existiendo.
