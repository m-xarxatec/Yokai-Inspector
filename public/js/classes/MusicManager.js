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
var _MusicManager_menuMusic;
export class MusicManager {
    constructor() {
        _MusicManager_menuMusic.set(this, void 0);
        __classPrivateFieldSet(this, _MusicManager_menuMusic, new Audio("sounds/menu.mp3"), "f");
        __classPrivateFieldGet(this, _MusicManager_menuMusic, "f").loop = true;
    }
    playMenu() {
        __classPrivateFieldGet(this, _MusicManager_menuMusic, "f").play().catch(() => { });
    }
    stop() {
        __classPrivateFieldGet(this, _MusicManager_menuMusic, "f").pause();
        __classPrivateFieldGet(this, _MusicManager_menuMusic, "f").currentTime = 0;
    }
}
_MusicManager_menuMusic = new WeakMap();
//# sourceMappingURL=MusicManager.js.map