export class SoundManager {
    #stampSound: HTMLAudioElement;
    #wrongSound: HTMLAudioElement;
    #nextButtonSound: HTMLAudioElement; // sonido de click para los botones generales
    #paperFlipSound: HTMLAudioElement; // sonido al abrir el pasaporte
    #nextPleaseSound: HTMLAudioElement; // sonido de "siguiente por favor" al llamar al pasajero
    #victorySound: HTMLAudioElement; // sonido cuando el usuario gana la partida
    #loseSound: HTMLAudioElement; // sonido cuando el usuario pierde la partida
    #writeSound: HTMLAudioElement; // sonido de escritura cuando aparece el texto de error de la jefa
    #writeClone: HTMLAudioElement | null; // el clon de "escribir" que esta sonando ahora, para poder cortarlo
    #muted: boolean; // true = todos los efectos de sonido estan silenciados

    constructor() {
        this.#stampSound = new Audio("sounds/stamp.mp3");
        this.#wrongSound = new Audio("sounds/wrong.wav");
        this.#nextButtonSound = new Audio("sounds/nextButton.mp3"); // carga el archivo del boton
        this.#paperFlipSound = new Audio("sounds/paperFlip.mp3"); // carga el archivo del pasaporte
        this.#nextPleaseSound = new Audio("sounds/nextPlease.mp3"); // carga el archivo de "siguiente por favor"
        this.#victorySound = new Audio("sounds/victorySound.mp3"); // carga el archivo de victoria
        this.#loseSound = new Audio("sounds/loseSound.mp3"); // carga el archivo de derrota
        this.#writeSound = new Audio("sounds/write.mp3"); // carga el archivo de escritura
        this.#writeClone = null; // todavia no sono ninguno
        this.#muted = false; // arranca con el sonido activado
    }

    // activa o desactiva TODOS los efectos de sonido, incluidos los que se
    // reproduzcan despues de llamar este metodo (lo revisa #playClone antes
    // de cada .play()). No se usa la propiedad "muted" de cada Audio porque
    // #playClone clona el audio en cada reproduccion, y ese "muted" no se
    // copia al clon (no es un atributo HTML, es estado en memoria)
    setMuted(muted: boolean): void {
        this.#muted = muted;
    }

    // clona el audio antes de reproducirlo: si se llama de nuevo mientras el
    // clon anterior todavia esta sonando, no se interrumpen entre si (por eso
    // a veces el sonido no se escuchaba al clickear rapido)
    #playClone(sound: HTMLAudioElement): void {
        if (this.#muted) {
            return; // silenciado: no reproduce nada
        }
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

    // este sonido NO usa #playClone: se guarda el clon aparte para poder
    // apagarlo antes con stopWrite() (al apretar "Siguiente" o "Volver al
    // menu"), y ademas se corta solo a los 1500ms por si el jugador tarda en
    // clickear - el archivo original es mas largo que eso
    playWrite(): void {
        if (this.#muted) {
            return; // silenciado: no reproduce nada
        }
        const clone = this.#writeSound.cloneNode() as HTMLAudioElement; // copia independiente del audio
        this.#writeClone = clone;
        clone.play().catch(() => {}); // evita que un error de reproduccion quede sin manejar
        window.setTimeout(() => {
            clone.pause(); // corta el sonido aunque el archivo original sea mas largo
        }, 1500);
    }

    // corta de una el sonido de escritura si todavia esta sonando (se llama
    // al apretar "Siguiente", para que no se siga escuchando en la pantalla siguiente)
    stopWrite(): void {
        if (this.#writeClone !== null) {
            this.#writeClone.pause();
            this.#writeClone = null;
        }
    }
}
