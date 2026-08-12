// ARCHIVO TEMPORAL - solo para probar CSS/diseño mientras main.ts (Iralys) no está listo.
// No es parte del proyecto entregable. Se borra cuando se fusione el main.ts real.

const screens = ["menu-screen", "game-screen", "day-result-screen", "final-screen"];
const variants = ["variante-1", "variante-2", "variante-3"];
const rostros = Array.from({ length: 24 }, (_, i) => "rostro-" + (i + 1));
const eyeShapes = Array.from({ length: 17 }, (_, i) => "eyes-" + (i + 1));

function showScreen(id) {
  screens.forEach((s) => document.getElementById(s).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function randomVariant(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Precarga todas las imagenes de rostro en la cache del navegador antes de usarlas
// como background-image. Sin esto, cada cambio de clase deja el recuadro en blanco
// un instante mientras el navegador recien empieza a pedir/decodificar la imagen.
function preloadImages(urls) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

function randomizePortrait() {
  const faceEl = document.querySelector(".part-face");
  faceEl.className = "part part-face " + randomVariant(rostros);

  // ojos: si "es Kitsune" (simulado al azar), usar la imagen dedicada yellowEyes -
  // nunca es un color aplicado sobre una forma al azar, es una imagen propia.
  const isYellowEyes = Math.random() < 0.3;
  const eyesClass = isYellowEyes ? "yellowEyes" : randomVariant(eyeShapes);
  document.querySelector(".part-eyes").className = "part part-eyes " + eyesClass;

  ["mouth", "horns"].forEach((part) => {
    const el = document.querySelector(".part-" + part);
    el.className = "part part-" + part + " " + randomVariant(variants);
  });
  // simula "a veces tiene cuernos, a veces no"
  document.querySelector(".part-horns").style.display = Math.random() < 0.5 ? "block" : "none";
}

window.addEventListener("DOMContentLoaded", () => {
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  bar.style.bottom = "0";
  bar.style.left = "0";
  bar.style.right = "0";
  bar.style.background = "#000";
  bar.style.padding = "0.5rem";
  bar.style.display = "flex";
  bar.style.gap = "0.4rem";
  bar.style.flexWrap = "wrap";
  bar.style.zIndex = "999";

  screens.forEach((s) => {
    const btn = document.createElement("button");
    btn.textContent = "Ver: " + s;
    btn.addEventListener("click", () => showScreen(s));
    bar.appendChild(btn);
  });

  const randomBtn = document.createElement("button");
  randomBtn.textContent = "Aleatorizar retrato";
  randomBtn.addEventListener("click", randomizePortrait);
  bar.appendChild(randomBtn);

  document.body.appendChild(bar);

  preloadImages(rostros.map((r) => "img/baseCharacters/" + r + ".png"));
  preloadImages(eyeShapes.map((e) => "img/eyes/" + e + ".png"));
  preloadImages(["img/eyes/yellowEyes.png"]);
  randomizePortrait();
});
