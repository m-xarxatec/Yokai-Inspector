import { setDecisionStampsEnabled } from "./characterSlide.js";
// una vez que el jugador hace click sobre el pasaporte cerrado, espera un poco
// antes de abrirlo (para que se sienta como que se abre, no que cambia de golpe)
const PASSPORT_OPEN_DELAY_MS = 150;
// 3 imagenes por sello (ver public/img/sellos/): pos1 en reposo sobre el
// escritorio, pos2 mientras se arrastra, pos3 al acercarse/soltar sobre el
// pasaporte (esa es la que dispara la decision). Al soltar el mouse en
// cualquier lado, siempre vuelve solo a pos1 en su posicion inicial - eso lo
// hace solo la transicion de left/top/height de .stamp-drag en style.css en
// cuanto se saca la clase .arrastrando (que la apaga durante el arrastre para
// que siga al mouse sin retraso).
// OJO: estos valores tienen que coincidir con el "left"/"top" que cada sello
// tiene en style.css - el CSS los coloca al cargar la pagina, y returnToRest()
// los vuelve a poner despues de cada arrastre. Si se cambia uno solo, el sello
// aparece en un lado y "vuelve" a otro (paso con el azul al moverlo a 29%).
const STAMP_REST_POSITION = {
    "alien-btn": { left: 29, top: 78 },
    "reject-btn": { left: 80, top: 78 },
    "accept-btn": { left: 91, top: 78 },
};
// que tan cerca del pasaporte (en px de pantalla, expandiendo su propio
// rectangulo) cuenta como "acercandolo" - bastante generoso a proposito, el
// pasaporte es chico y no hace falta puntería quirúrgica
const STAMP_DROP_MARGIN_PX = 60;
function isNearPassport(clientX, clientY) {
    const passportEl = document.querySelector("#passport-object");
    if (passportEl === null || !passportEl.classList.contains("open")) {
        return false;
    }
    const rect = passportEl.getBoundingClientRect();
    return (clientX >= rect.left - STAMP_DROP_MARGIN_PX &&
        clientX <= rect.right + STAMP_DROP_MARGIN_PX &&
        clientY >= rect.top - STAMP_DROP_MARGIN_PX &&
        clientY <= rect.bottom + STAMP_DROP_MARGIN_PX);
}
// usedAlienStamp: true solo para el sello azul, el que aprueba a los alien desde
// el dia 6 (ver Game.decide()). Los otros dos lo dejan en false y se comportan
// exactamente igual que antes.
function setupStampDrag(id, accept, usedAlienStamp, soundManager, resolveDecision) {
    const stampEl = document.querySelector("#" + id);
    const sceneEl = document.querySelector("#character-scene");
    const rest = STAMP_REST_POSITION[id];
    if (stampEl === null || sceneEl === null || rest === undefined) {
        return;
    }
    function returnToRest() {
        if (stampEl === null)
            return;
        stampEl.classList.remove("dragging", "pos2", "pos3");
        stampEl.classList.add("pos1");
        stampEl.style.left = rest.left + "%";
        stampEl.style.top = rest.top + "%";
        stampEl.style.height = "";
    }
    function move(clientX, clientY) {
        if (stampEl === null || sceneEl === null)
            return;
        const sceneRect = sceneEl.getBoundingClientRect();
        const left = ((clientX - sceneRect.left) / sceneRect.width) * 100;
        const top = ((clientY - sceneRect.top) / sceneRect.height) * 100;
        stampEl.style.left = Math.min(Math.max(left, 2), 98) + "%";
        stampEl.style.top = Math.min(Math.max(top, 2), 98) + "%";
        stampEl.classList.remove("pos2", "pos3");
        stampEl.classList.add(isNearPassport(clientX, clientY) ? "pos3" : "pos2");
    }
    stampEl.addEventListener("pointerdown", (event) => {
        if (stampEl.getAttribute("aria-disabled") === "true") {
            return;
        }
        stampEl.setPointerCapture(event.pointerId);
        stampEl.classList.add("dragging");
        move(event.clientX, event.clientY);
    });
    stampEl.addEventListener("pointermove", (event) => {
        if (!stampEl.classList.contains("dragging")) {
            return;
        }
        move(event.clientX, event.clientY);
    });
    stampEl.addEventListener("pointerup", (event) => {
        if (!stampEl.classList.contains("dragging")) {
            return;
        }
        const droppedNearPassport = isNearPassport(event.clientX, event.clientY);
        returnToRest();
        if (droppedNearPassport) {
            // sonido del sello al soltarlo sobre el pasaporte: verde = aceptar, rojo = rechazar
            accept ? soundManager.playAccept() : soundManager.playReject();
            resolveDecision(accept, usedAlienStamp);
        }
    });
    // activar/desactivar aria-disabled ya alcanza para que el mouse no arranque
    // el arrastre (ver el chequeo al principio de pointerdown), pero el teclado
    // (Enter/Espacio) no dispara pointerdown - se agrega un atajo directo, sin
    // arrastre, equivalente al viejo click del <button>
    stampEl.addEventListener("keydown", (event) => {
        if (stampEl.getAttribute("aria-disabled") === "true") {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            resolveDecision(accept, usedAlienStamp);
        }
    });
}
// registra el drag and drop de los 3 sellos y el click para abrir el
// pasaporte antes de poder usarlos - resolveDecision se recibe por parametro
// porque vive en main.ts (es el corazon del flujo, ver resolveDecision() ahi).
export function initStampDrag(soundManager, resolveDecision) {
    setupStampDrag("reject-btn", false, false, soundManager, resolveDecision);
    setupStampDrag("accept-btn", true, false, soundManager, resolveDecision);
    setupStampDrag("alien-btn", true, true, soundManager, resolveDecision);
    // el pasaporte no se abre solo: el jugador tiene que clickearlo una vez que el
    // personaje ya se lo entrego (clase "delivered", ver renderVisitor() en main.ts);
    // recien ahi se habilitan aceptar/rechazar - no se puede decidir sin haberlo abierto
    document.querySelector("#passport-object")?.addEventListener("click", () => {
        const passportEl = document.querySelector("#passport-object");
        if (passportEl === null) {
            return;
        }
        if (!passportEl.classList.contains("closed") || !passportEl.classList.contains("delivered")) {
            return;
        }
        soundManager.playPaperFlip(); // sonido de hoja al abrir el pasaporte
        passportEl.classList.remove("delivered");
        window.setTimeout(() => {
            passportEl.classList.remove("closed");
            passportEl.classList.add("open");
            setDecisionStampsEnabled(true);
        }, PASSPORT_OPEN_DELAY_MS);
    });
}
//# sourceMappingURL=stampDrag.js.map