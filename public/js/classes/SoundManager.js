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
var _SoundManager_stampSound, _SoundManager_wrongSound;
export class SoundManager {
    constructor() {
        _SoundManager_stampSound.set(this, void 0);
        _SoundManager_wrongSound.set(this, void 0);
        __classPrivateFieldSet(this, _SoundManager_stampSound, new Audio("sounds/stamp.mp3"), "f");
        __classPrivateFieldSet(this, _SoundManager_wrongSound, new Audio("sounds/wrong.wav"), "f");
    }
    playAccept() {
        __classPrivateFieldGet(this, _SoundManager_stampSound, "f").currentTime = 0;
        __classPrivateFieldGet(this, _SoundManager_stampSound, "f").play();
    }
    playReject() {
        __classPrivateFieldGet(this, _SoundManager_stampSound, "f").currentTime = 0;
        __classPrivateFieldGet(this, _SoundManager_stampSound, "f").play();
    }
    playWrong() {
        __classPrivateFieldGet(this, _SoundManager_wrongSound, "f").currentTime = 0;
        __classPrivateFieldGet(this, _SoundManager_wrongSound, "f").play();
    }
}
_SoundManager_stampSound = new WeakMap(), _SoundManager_wrongSound = new WeakMap();
//# sourceMappingURL=SoundManager.js.map