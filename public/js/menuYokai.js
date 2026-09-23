const SPEED = 42;
const ANGRY_AFTER_CLICKS = 3;
const CALM_DOWN_DELAY_MS = 30000;
const EDGE_GAP = 4;
const BORDER_OVERLAP = 8;
const SIDES = ["top", "right", "bottom", "left"];
let active = false;
let animationFrame = null;
let previousFrame = 0;
let side = "top";
let position = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let nextSide = null;
let clickCount = 0;
let calmDownTimer = null;
let variant = 1;
function randomBetween(min, max) {
    return min + Math.random() * Math.max(0, max - min);
}
function elements() {
    const yokai = document.querySelector("#menu-yokai");
    const image = yokai?.querySelector("img");
    const layout = document.querySelector("#menu-layout");
    return yokai !== null && image !== null && layout !== null ? { yokai, image, layout } : null;
}
function availableSides(size, layout) {
    return [
        ["top", layout.top >= size + EDGE_GAP - BORDER_OVERLAP],
        ["right", window.innerWidth - layout.right >= size + EDGE_GAP - BORDER_OVERLAP],
        ["bottom", window.innerHeight - layout.bottom >= size + EDGE_GAP - BORDER_OVERLAP],
        ["left", layout.left >= size + EDGE_GAP - BORDER_OVERLAP],
    ].filter(([, available]) => available).map(([candidate]) => candidate);
}
function fitYokaiInMenuBorder(menu) {
    const layout = menu.layout.getBoundingClientRect();
    const maximumSize = Math.min(58, layout.left - EDGE_GAP + BORDER_OVERLAP, window.innerWidth - layout.right - EDGE_GAP + BORDER_OVERLAP, layout.top - EDGE_GAP + BORDER_OVERLAP, window.innerHeight - layout.bottom - EDGE_GAP + BORDER_OVERLAP);
    // Se reduce lo necesario para que pueda recorrer también las franjas superior e inferior.
    menu.yokai.style.width = Math.max(18, maximumSize) + "px";
}
function pointOn(targetSide, size, layout) {
    const maxX = Math.max(EDGE_GAP, window.innerWidth - size - EDGE_GAP);
    const maxY = Math.max(EDGE_GAP, window.innerHeight - size - EDGE_GAP);
    switch (targetSide) {
        case "top": return { x: randomBetween(EDGE_GAP, maxX), y: Math.max(EDGE_GAP, (layout.top - size) / 2) };
        case "right": return { x: Math.min(maxX, layout.right + (window.innerWidth - layout.right - size) / 2), y: randomBetween(EDGE_GAP, maxY) };
        case "bottom": return { x: randomBetween(EDGE_GAP, maxX), y: Math.min(maxY, layout.bottom + (window.innerHeight - layout.bottom - size) / 2) };
        case "left": return { x: Math.max(EDGE_GAP, (layout.left - size) / 2), y: randomBetween(EDGE_GAP, maxY) };
    }
}
function cornerTo(from, to, size, layout) {
    const fromPoint = pointOn(from, size, layout);
    const toPoint = pointOn(to, size, layout);
    return from === "top" || from === "bottom"
        ? { x: toPoint.x, y: fromPoint.y }
        : { x: fromPoint.x, y: toPoint.y };
}
function chooseNextTarget() {
    const menu = elements();
    if (menu === null)
        return;
    const size = menu.yokai.getBoundingClientRect().width;
    const layout = menu.layout.getBoundingClientRect();
    const usable = availableSides(size, layout);
    if (usable.length === 0)
        return;
    if (!usable.includes(side)) {
        side = usable[Math.floor(Math.random() * usable.length)];
        position = pointOn(side, size, layout);
    }
    if (usable.length === 1 || Math.random() < 0.38) {
        target = pointOn(side, size, layout);
        return;
    }
    const step = Math.random() < 0.5 ? -1 : 1;
    let candidate = side;
    do {
        candidate = SIDES[(SIDES.indexOf(candidate) + step + SIDES.length) % SIDES.length];
    } while (!usable.includes(candidate));
    nextSide = candidate;
    target = cornerTo(side, candidate, size, layout);
}
function paint() {
    const menu = elements();
    if (menu === null)
        return;
    menu.yokai.style.left = position.x + "px";
    menu.yokai.style.top = position.y + "px";
}
function animate(frameTime) {
    if (!active)
        return;
    if (previousFrame === 0)
        previousFrame = frameTime;
    const elapsed = Math.min((frameTime - previousFrame) / 1000, 0.05);
    previousFrame = frameTime;
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const distance = Math.hypot(dx, dy);
    const movement = SPEED * elapsed;
    if (distance <= movement || distance === 0) {
        position = { ...target };
        if (nextSide !== null) {
            side = nextSide;
            nextSide = null;
        }
        chooseNextTarget();
    }
    else {
        position.x += dx / distance * movement;
        position.y += dy / distance * movement;
    }
    paint();
    animationFrame = window.requestAnimationFrame(animate);
}
function setAngry(isAngry) {
    const menu = elements();
    if (menu === null)
        return;
    menu.yokai.classList.toggle("is-angry", isAngry);
    menu.image.src = "img/animaciones/yokai" + variant + (isAngry ? "_enojado" : "") + ".webp";
}
function reverseDirection() {
    const menu = elements();
    if (menu === null)
        return;
    const size = menu.yokai.getBoundingClientRect().width;
    const layout = menu.layout.getBoundingClientRect();
    const reverseTarget = pointOn(side, size, layout);
    const backwardDistance = randomBetween(80, 180);
    if (side === "top" || side === "bottom") {
        const direction = Math.sign(target.x - position.x) || 1;
        reverseTarget.x = Math.min(Math.max(position.x - direction * backwardDistance, EDGE_GAP), window.innerWidth - size - EDGE_GAP);
        reverseTarget.y = position.y;
    }
    else {
        const direction = Math.sign(target.y - position.y) || 1;
        reverseTarget.y = Math.min(Math.max(position.y - direction * backwardDistance, EDGE_GAP), window.innerHeight - size - EDGE_GAP);
        reverseTarget.x = position.x;
    }
    nextSide = null;
    target = reverseTarget;
}
function resetCalmDownTimer() {
    if (calmDownTimer !== null)
        window.clearTimeout(calmDownTimer);
    calmDownTimer = window.setTimeout(() => {
        clickCount = 0;
        setAngry(false);
    }, CALM_DOWN_DELAY_MS);
}
function handleClick() {
    const menu = elements();
    if (menu === null)
        return;
    clickCount += 1;
    resetCalmDownTimer();
    if (clickCount > ANGRY_AFTER_CLICKS)
        setAngry(true);
    menu.yokai.classList.remove("is-jumping");
    void menu.yokai.offsetWidth;
    menu.yokai.classList.add("is-jumping");
    reverseDirection();
}
function resetTrack() {
    const menu = elements();
    if (menu === null)
        return;
    fitYokaiInMenuBorder(menu);
    const layout = menu.layout.getBoundingClientRect();
    const size = menu.yokai.getBoundingClientRect().width;
    const usable = availableSides(size, layout);
    if (usable.length === 0) {
        menu.yokai.classList.add("hidden");
        return;
    }
    menu.yokai.classList.remove("hidden");
    side = usable[Math.floor(Math.random() * usable.length)];
    position = pointOn(side, size, layout);
    nextSide = null;
    chooseNextTarget();
    paint();
}
export function initMenuYokai() {
    const menu = elements();
    if (menu === null)
        return;
    variant = Math.floor(Math.random() * 4) + 1;
    setAngry(false);
    menu.yokai.addEventListener("click", handleClick);
    window.addEventListener("resize", () => {
        if (active)
            resetTrack();
    });
}
export function setMenuYokaiActive(shouldBeActive) {
    if (active === shouldBeActive)
        return;
    active = shouldBeActive;
    if (!active) {
        if (animationFrame !== null)
            window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
        previousFrame = 0;
        return;
    }
    resetTrack();
    animationFrame = window.requestAnimationFrame(animate);
}
//# sourceMappingURL=menuYokai.js.map