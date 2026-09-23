export function preloadVisitorImages(visitor) {
    const eyes = visitor.obtainYellowEyes ? "yellowEyes" : visitor.obtainEyes;
    const urls = [
        "img/baseCharacters/" + visitor.obtainFace + ".webp",
        "img/eyes/" + eyes + ".webp",
        "img/mouth/" + visitor.obtainMouth + ".webp",
    ];
    if (visitor.obtainHaveHorns) {
        urls.push("img/cuernos/" + visitor.obtainHorns + ".webp");
    }
    urls.forEach(url => {
        const image = new Image();
        image.src = url;
    });
}
//# sourceMappingURL=preload.js.map