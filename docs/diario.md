Dia 1: 

se esta creando el esqueleto del proyecto, directorios, archivos informativos (docs), aun no se programa nada

---

2026-08-10:

Repaso de la arquitectura antes de programar en serio: se decidió no crear `Appearance`, `CharacterFactory` ni `UIManager` como clases separadas para no sobrecomplicar el proyecto en el tiempo disponible. En esa misma sesión se definieron las 3 especies de Yokai (Oni, Kitsune, Kappa), sus rasgos distintivos, las 5 reglas del juego (una por día, acumulativas) y la historia base del GDD. También en este punto se acordó programar todo en inglés (nombres de clases, campos y métodos), a diferencia de los documentos de diseño que quedaron en español.

Mike programó las clases de personajes: `Passport`, `Character` (abstracta), `Human` y `Yokai`, con sus campos privados, getters, y los métodos `dialogueLine()` y `specieLiar()` (este último pensado para sobreescritura/polimorfismo). Iralys programó `Rule`, `Day` y `Storage`.

Se configuró el proyecto para compilar TypeScript a JavaScript plano (`package.json` + `tsconfig.json`, sin frameworks ni bundlers).

Se integraron ambas partes por primera vez: rama `objetosMike` y rama `objetosIralys` fusionadas a `develop`. Durante la integración aparecieron algunas inconsistencias esperables entre partes escritas por separado (nombres de métodos y estilo de import), que se revisaron y corrigieron antes de dar la integración por cerrada. Queda pendiente `Game.ts` (la clase que conecta ambas partes) y la interfaz (`main.ts` + HTML/CSS) quedan como el siguiente trabajo conjunto.
