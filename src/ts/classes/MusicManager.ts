export class MusicManager {
    #menuMusic: HTMLAudioElement;

    constructor() {
        this.#menuMusic = new Audio("sounds/menu.mp3");
        this.#menuMusic.loop = true;
    }

    // cambia el volumen de la musica de fondo. Aca si se puede asignar
    // "volume" directo porque la musica NUNCA se clona (es un solo audio en loop).
    // El archivo esta mezclado muy alto - tope fijo al 50% del volumen general,
    // los efectos de SoundManager no llevan este tope
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
