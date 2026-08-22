export class MusicManager {
    #menuMusic: HTMLAudioElement;

    constructor() {
        this.#menuMusic = new Audio("sounds/menu.mp3");
        this.#menuMusic.loop = true;
    }

    // silencia o reactiva la musica de fondo. Aca si se puede usar "muted"
    // directo porque la musica NUNCA se clona (es un solo audio en loop)
    setMuted(muted: boolean): void {
        this.#menuMusic.muted = muted;
    }

    playMenu(): void {
        this.#menuMusic.play().catch(() => {});
    }

    stop(): void {
        this.#menuMusic.pause();
        this.#menuMusic.currentTime = 0;
    }
}
