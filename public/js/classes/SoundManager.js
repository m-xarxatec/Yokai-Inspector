var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SoundManager_instances, _SoundManager_stampSound, _SoundManager_wrongSound, _SoundManager_nextButtonSound, _SoundManager_paperFlipSound, _SoundManager_nextPleaseSound, _SoundManager_victorySound, _SoundManager_loseSound, _SoundManager_muted, _SoundManager_playClone;
export class SoundManager {
    constructor() {
        _SoundManager_instances.add(this);
        _SoundManager_stampSound.set(this, void 0);
        _SoundManager_wrongSound.set(this, void 0);
        _SoundManager_nextButtonSound.set(this, void 0); // sonido de click para los botones generales
        _SoundManager_paperFlipSound.set(this, void 0); // sonido al abrir el pasaporte
        _SoundManager_nextPleaseSound.set(this, void 0); // sonido de "siguiente por favor" al llamar al pasajero
        _SoundManager_victorySound.set(this, void 0); // sonido cuando el usuario gana la partida
        _SoundManager_loseSound.set(this, void 0); // sonido cuando el usuario pierde la partida
        _SoundManager_muted.set(this, void 0); // true = todos los efectos de sonido estan silenciados
        __classPrivateFieldSet(this, _SoundManager_stampSound, new Audio("sounds/stamp.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_wrongSound, new Audio("sounds/wrong.wav"), "f");
        __classPrivateFieldSet(this, _SoundManager_nextButtonSound, new Audio("sounds/nextButton.mp3"), "f"); // carga el archivo del boton
        __classPrivateFieldSet(this, _SoundManager_paperFlipSound, new Audio("sounds/paperFlip.mp3"), "f"); // carga el archivo del pasaporte
        __classPrivateFieldSet(this, _SoundManager_nextPleaseSound, new Audio("sounds/nextPlease.mp3"), "f"); // carga el archivo de "siguiente por favor"
        __classPrivateFieldSet(this, _SoundManager_victorySound, new Audio("sounds/victorySound.mp3"), "f"); // carga el archivo de victoria
        __classPrivateFieldSet(this, _SoundManager_loseSound, new Audio("sounds/loseSound.mp3"), "f"); // carga el archivo de derrota
        __classPrivateFieldSet(this, _SoundManager_muted, false, "f"); // arranca con el sonido activado
    }
    // activa o desactiva TODOS los efectos de sonido, incluidos los que se
    // reproduzcan despues de llamar este metodo (lo revisa #playClone antes
    // de cada .play()). No se usa la propiedad "muted" de cada Audio porque
    // #playClone clona el audio en cada reproduccion, y ese "muted" no se
    // copia al clon (no es un atributo HTML, es estado en memoria)
    setMuted(muted) {
        __classPrivateFieldSet(this, _SoundManager_muted, muted, "f");
    }
    playAccept() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_stampSound, "f"));
    }
    playReject() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_stampSound, "f"));
    }
    playWrong() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_wrongSound, "f"));
    }
    playNextButton() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_nextButtonSound, "f")); // reproduce el sonido del boton
    }
    playPaperFlip() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_paperFlipSound, "f")); // reproduce el sonido de abrir el pasaporte
    }
    playNextPlease() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_nextPleaseSound, "f")); // reproduce el sonido de "siguiente por favor"
    }
    playVictory() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_victorySound, "f")); // reproduce el sonido de victoria
    }
    playLose() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_loseSound, "f")); // reproduce el sonido de derrota
    }
}
_SoundManager_stampSound = new WeakMap(), _SoundManager_wrongSound = new WeakMap(), _SoundManager_nextButtonSound = new WeakMap(), _SoundManager_paperFlipSound = new WeakMap(), _SoundManager_nextPleaseSound = new WeakMap(), _SoundManager_victorySound = new WeakMap(), _SoundManager_loseSound = new WeakMap(), _SoundManager_muted = new WeakMap(), _SoundManager_instances = new WeakSet(), _SoundManager_playClone = function _SoundManager_playClone(sound) {
    if (__classPrivateFieldGet(this, _SoundManager_muted, "f")) {
        return; // silenciado: no reproduce nada
    }
    const clone = sound.cloneNode(); // copia independiente del audio
    clone.play().catch(() => { }); // evita que un error de reproduccion quede sin manejar
};
//# sourceMappingURL=SoundManager.js.map