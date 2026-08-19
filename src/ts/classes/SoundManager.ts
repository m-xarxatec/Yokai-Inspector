export class SoundManager {
    #stampSound: HTMLAudioElement;
    #wrongSound: HTMLAudioElement;

    constructor() {
        this.#stampSound = new Audio("sounds/stamp.mp3");
        this.#wrongSound = new Audio("sounds/wrong.wav");
    }

    playAccept(): void {
        this.#stampSound.currentTime = 0;
        this.#stampSound.play();
    }

    playReject(): void {
        this.#stampSound.currentTime = 0;
        this.#stampSound.play();
    }

    playWrong(): void {
        this.#wrongSound.currentTime = 0;
        this.#wrongSound.play();
    }
}
