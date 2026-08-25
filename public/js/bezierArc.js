// evaluador de una curva cubic-bezier(x1,y1,x2,y2), igual a la que usa CSS en
// animation-timing-function - si y2 > 1 el resultado pasa de 1 antes de
// asentarse (efecto de rebote/overshoot); PASSPORT_ARC_EASING no lo usa (y2
// no pasa de 1), es solo una desaceleracion suave, sin rebote
export function createCubicBezierEasing(x1, y1, x2, y2) {
    function onAxis(a1, a2, t) {
        const oneMinusT = 1 - t;
        return 3 * oneMinusT * oneMinusT * t * a1 + 3 * oneMinusT * t * t * a2 + t * t * t;
    }
    function derivativeOnAxis(a1, a2, t) {
        const oneMinusT = 1 - t;
        return 3 * oneMinusT * oneMinusT * a1 + 6 * oneMinusT * t * (a2 - a1) + 3 * t * t * (1 - a2);
    }
    return function easing(x) {
        let t = x;
        for (let i = 0; i < 8; i += 1) {
            const slope = derivativeOnAxis(x1, x2, t);
            if (Math.abs(slope) > 0.000001) {
                t = t - (onAxis(x1, x2, t) - x) / slope;
            }
        }
        return onAxis(y1, y2, t);
    };
}
// el z-index no puede depender solo de la altura del arco: la base del personaje
// (88%) y el escritorio (80%) estan demasiado cerca en top como para distinguirlos
// asi. Se distingue por direccion, y cada direccion necesita su propia señal:
//
// - devolucion: al frente solo en el primer tramo del recorrido (recien cerrado
//   sobre el escritorio), detras el resto - un umbral de tiempo alcanza.
// - entrega: sale detras (se pierde detras de la ventanilla al subir), y pasa al
//   frente en cuanto cruza el punto mas alto del arco y empieza a caer - de ahi
//   en adelante se queda al frente hasta aterrizar (ver yaPasoElPico en
//   animatePassportAlongArc). No alcanza un umbral fijo de tiempo/altura porque
//   el arco es asimetrico (el pico no cae a la mitad del recorrido).
const PASSPORT_ARC_FRONT_THRESHOLD = 0.7;
const PASSPORT_BEHIND_Z_INDEX = "2";
// mueve #passport-object en una curva de bezier cuadratica (desde -> control ->
// hasta), con el tamaño interpolado con el mismo facilitador para que el rebote
// tambien se sienta en el "crecimiento" - queda con estilos inline al terminar,
// asi que alTerminar() es responsable de limpiarlos si hace falta.
//
// terminaEnElEscritorio indica la direccion (true = entrega, false = devolucion):
// el pasaporte solo va "al frente" (encima de la ventanilla/el escritorio) en el
// tramo del recorrido mas cercano al escritorio - el resto del arco (saliendo o
// volviendo hacia el personaje, y el pico) queda detras, ver PASSPORT_ARC_FRONT_THRESHOLD
export function animatePassportAlongArc(from, control, to, durationMs, easing, endsAtDesk, onFinish) {
    const passportEl = document.querySelector("#passport-object");
    if (passportEl === null) {
        onFinish();
        return;
    }
    const el = passportEl;
    el.style.transition = "none";
    // fija el z-index inicial ya (sincronico, antes del primer frame) en vez de
    // confiar en lo que haya quedado de una animacion anterior - si no, en la
    // primera entrega de la sesion (sin devolucion previa que lo deje "detras")
    // el z-index por defecto del CSS (5, al frente) queda aplicado hasta que
    // corre el primer requestAnimationFrame, y ese instante ya alcanza para que
    // se vea el pasaporte pasando por delante de la ventanilla al arrancar.
    el.style.zIndex = endsAtDesk ? PASSPORT_BEHIND_Z_INDEX : "";
    const startTime = performance.now();
    // para la entrega: en cuanto el "top" deja de subir (deja de acercarse a 0,
    // es decir ya curso el punto mas alto del arco) el pasaporte esta cayendo -
    // de ahi en mas siempre al frente, sin importar que tan alto este todavia
    // (ver comentario junto a PASSPORT_ARC_FRONT_THRESHOLD mas arriba)
    let minTopSeen = from.top;
    let pastPeak = false;
    function step(now) {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const t = easing(progress);
        const oneMinusT = 1 - t;
        const left = oneMinusT * oneMinusT * from.left + 2 * oneMinusT * t * control.left + t * t * to.left;
        const top = oneMinusT * oneMinusT * from.top + 2 * oneMinusT * t * control.top + t * t * to.top;
        const height = from.height + (to.height - from.height) * t;
        el.style.left = left + "%";
        el.style.top = top + "%";
        el.style.height = height + "%";
        let inFront;
        if (endsAtDesk) {
            if (top > minTopSeen) {
                pastPeak = true;
            }
            else {
                minTopSeen = top;
            }
            inFront = pastPeak;
        }
        else {
            const approachingDesk = 1 - progress;
            inFront = approachingDesk >= PASSPORT_ARC_FRONT_THRESHOLD;
        }
        if (inFront) {
            el.style.zIndex = "";
        }
        else {
            el.style.zIndex = PASSPORT_BEHIND_Z_INDEX;
        }
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
        else {
            onFinish();
        }
    }
    window.requestAnimationFrame(step);
}
//# sourceMappingURL=bezierArc.js.map