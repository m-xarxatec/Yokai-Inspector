export class MusicManager {
    #menuMusic: HTMLAudioElement;

    constructor() {
        this.#menuMusic = new Audio("sounds/menu.mp3");
        this.#menuMusic.loop = true;
    }

    setVolume(volume: number): void {
        this.#menuMusic.volume = volume * 0.5;
    }

    playMenu(): void {
        this.#menuMusic.play().catch(() => {});
    }

    stop(): void {
        this.#menuMusic.pause();
        this.#menuMusic.currentTime = 0;
    }
}
