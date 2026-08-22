export class SoundManager {
    #stampSound: HTMLAudioElement;
    #wrongSound: HTMLAudioElement;
    #nextButtonSound: HTMLAudioElement; // sonido de click para los botones generales
    #paperFlipSound: HTMLAudioElement; // sonido al abrir el pasaporte
    #nextPleaseSound: HTMLAudioElement; // sonido de "siguiente por favor" al llamar al pasajero
    #victorySound: HTMLAudioElement; // sonido cuando el usuario gana la partida
    #loseSound: HTMLAudioElement; // sonido cuando el usuario pierde la partida

    constructor() {
        this.#stampSound = new Audio("sounds/stamp.mp3");
        this.#wrongSound = new Audio("sounds/wrong.wav");
        this.#nextButtonSound = new Audio("sounds/nextButton.mp3"); // carga el archivo del boton
        this.#paperFlipSound = new Audio("sounds/paperFlip.mp3"); // carga el archivo del pasaporte
        this.#nextPleaseSound = new Audio("sounds/nextPlease.mp3"); // carga el archivo de "siguiente por favor"
        this.#victorySound = new Audio("sounds/victorySound.mp3"); // carga el archivo de victoria
        this.#loseSound = new Audio("sounds/loseSound.mp3"); // carga el archivo de derrota
    }

    // clona el audio antes de reproducirlo: si se llama de nuevo mientras el
    // clon anterior todavia esta sonando, no se interrumpen entre si (por eso
    // a veces el sonido no se escuchaba al clickear rapido)
    #playClone(sound: HTMLAudioElement): void {
        const clone = sound.cloneNode() as HTMLAudioElement; // copia independiente del audio
        clone.play().catch(() => {}); // evita que un error de reproduccion quede sin manejar
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
        this.#playClone(this.#nextButtonSound); // reproduce el sonido del boton
    }

    playPaperFlip(): void {
        this.#playClone(this.#paperFlipSound); // reproduce el sonido de abrir el pasaporte
    }

    playNextPlease(): void {
        this.#playClone(this.#nextPleaseSound); // reproduce el sonido de "siguiente por favor"
    }

    playVictory(): void {
        this.#playClone(this.#victorySound); // reproduce el sonido de victoria
    }

    playLose(): void {
        this.#playClone(this.#loseSound); // reproduce el sonido de derrota
    }
}
