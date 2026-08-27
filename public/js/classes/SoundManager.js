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
var _SoundManager_instances, _SoundManager_stampSound, _SoundManager_wrongSound, _SoundManager_nextButtonSound, _SoundManager_paperFlipSound, _SoundManager_victorySound, _SoundManager_loseSound, _SoundManager_writeSound, _SoundManager_writeClone, _SoundManager_volume, _SoundManager_playClone;
export class SoundManager {
    constructor() {
        _SoundManager_instances.add(this);
        _SoundManager_stampSound.set(this, void 0);
        _SoundManager_wrongSound.set(this, void 0);
        _SoundManager_nextButtonSound.set(this, void 0);
        _SoundManager_paperFlipSound.set(this, void 0);
        _SoundManager_victorySound.set(this, void 0);
        _SoundManager_loseSound.set(this, void 0);
        _SoundManager_writeSound.set(this, void 0);
        _SoundManager_writeClone.set(this, void 0);
        _SoundManager_volume.set(this, void 0);
        __classPrivateFieldSet(this, _SoundManager_stampSound, new Audio("sounds/stamp.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_wrongSound, new Audio("sounds/wrong.wav"), "f");
        __classPrivateFieldSet(this, _SoundManager_nextButtonSound, new Audio("sounds/nextButton.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_paperFlipSound, new Audio("sounds/paperFlip.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_victorySound, new Audio("sounds/victorySound.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_loseSound, new Audio("sounds/loseSound.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_writeSound, new Audio("sounds/write.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_writeClone, null, "f");
        __classPrivateFieldSet(this, _SoundManager_volume, 1, "f");
    }
    setVolume(volume) {
        __classPrivateFieldSet(this, _SoundManager_volume, volume, "f");
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
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_nextButtonSound, "f"));
    }
    playPaperFlip() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_paperFlipSound, "f"));
    }
    playVictory() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_victorySound, "f"));
    }
    playLose() {
        __classPrivateFieldGet(this, _SoundManager_instances, "m", _SoundManager_playClone).call(this, __classPrivateFieldGet(this, _SoundManager_loseSound, "f"));
    }
    playWrite() {
        if (__classPrivateFieldGet(this, _SoundManager_volume, "f") === 0) {
            return;
        }
        const clone = __classPrivateFieldGet(this, _SoundManager_writeSound, "f").cloneNode();
        clone.volume = __classPrivateFieldGet(this, _SoundManager_volume, "f");
        __classPrivateFieldSet(this, _SoundManager_writeClone, clone, "f");
        clone.play().catch(() => { });
        window.setTimeout(() => {
            clone.pause();
        }, 1500);
    }
    stopWrite() {
        if (__classPrivateFieldGet(this, _SoundManager_writeClone, "f") !== null) {
            __classPrivateFieldGet(this, _SoundManager_writeClone, "f").pause();
            __classPrivateFieldSet(this, _SoundManager_writeClone, null, "f");
        }
    }
}
_SoundManager_stampSound = new WeakMap(), _SoundManager_wrongSound = new WeakMap(), _SoundManager_nextButtonSound = new WeakMap(), _SoundManager_paperFlipSound = new WeakMap(), _SoundManager_victorySound = new WeakMap(), _SoundManager_loseSound = new WeakMap(), _SoundManager_writeSound = new WeakMap(), _SoundManager_writeClone = new WeakMap(), _SoundManager_volume = new WeakMap(), _SoundManager_instances = new WeakSet(), _SoundManager_playClone = function _SoundManager_playClone(sound) {
    if (__classPrivateFieldGet(this, _SoundManager_volume, "f") === 0) {
        return;
    }
    const clone = sound.cloneNode();
    clone.volume = __classPrivateFieldGet(this, _SoundManager_volume, "f");
    clone.play().catch(() => { });
};
//# sourceMappingURL=SoundManager.js.map