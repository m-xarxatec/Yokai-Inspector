export class SoundManager {
    #stampSound: HTMLAudioElement;
    #wrongSound: HTMLAudioElement;
    #nextButtonSound: HTMLAudioElement;
    #paperFlipSound: HTMLAudioElement;
    #victorySound: HTMLAudioElement;
    #loseSound: HTMLAudioElement;
    #writeSound: HTMLAudioElement;
    #writeClone: HTMLAudioElement | null;
    #volume: number;

    constructor() {
        this.#stampSound = new Audio("sounds/stamp.mp3");
        this.#wrongSound = new Audio("sounds/wrong.wav");
        this.#nextButtonSound = new Audio("sounds/nextButton.mp3");
        this.#paperFlipSound = new Audio("sounds/paperFlip.mp3");
        this.#victorySound = new Audio("sounds/victorySound.mp3");
        this.#loseSound = new Audio("sounds/loseSound.mp3");
        this.#writeSound = new Audio("sounds/write.mp3");
        this.#writeClone = null;
        this.#volume = 1;
    }

    setVolume(volume: number): void {
        this.#volume = volume;
    }

    #playClone(sound: HTMLAudioElement): void {
        if (this.#volume === 0) {
            return;
        }
        const clone = sound.cloneNode() as HTMLAudioElement;
        clone.volume = this.#volume;
        clone.play().catch(() => {});
    }

    playAccept(): void {
        this.#playClone(this.#stampSound);
    }

    playReject(): void {
        this.#playClone(this.#stampSound);
    }

    playWrong(): void {
        this.#playClone(this.#wrongSound);
    }

    playNextButton(): void {
        this.#playClone(this.#nextButtonSound);
    }

    playPaperFlip(): void {
        this.#playClone(this.#paperFlipSound);
    }

    playVictory(): void {
        this.#playClone(this.#victorySound);
    }

    playLose(): void {
        this.#playClone(this.#loseSound);
    }

    playWrite(): void {
        if (this.#volume === 0) {
            return;
        }
        const clone = this.#writeSound.cloneNode() as HTMLAudioElement;
        clone.volume = this.#volume;
        this.#writeClone = clone;
        clone.play().catch(() => {});
        window.setTimeout(() => {
            clone.pause();
        }, 1500);
    }

    stopWrite(): void {
        if (this.#writeClone !== null) {
            this.#writeClone.pause();
            this.#writeClone = null;
        }
    }
}
