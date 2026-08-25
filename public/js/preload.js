// --- Precarga de imagenes (evita el parpadeo al cambiar de visitante) ---
function preloadImages(urls) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}
export function preloadCharacterImages() {
    fetch("data/partes.json")
        .then(r => r.json())
        .then(parts => {
        const faceUrls = parts.rostro.concat(parts.alienes).map((name) => "img/baseCharacters/" + name + ".png");
        const eyesUrls = parts.ojos.map((name) => "img/eyes/" + name + ".png");
        const mouthUrls = parts.boca.map((name) => "img/mouth/" + name + ".png");
        preloadImages(faceUrls);
        preloadImages(eyesUrls);
        preloadImages(mouthUrls);
        preloadImages(["img/eyes/" + parts.ojosAmarillos + ".png"]);
    })
        .catch(error => console.log("no se pudieron precargar las imagenes", error));
}
//# sourceMappingURL=preload.js.map