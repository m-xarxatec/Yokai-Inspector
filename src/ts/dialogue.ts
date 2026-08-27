// --- efecto de dialogo tipo subtitulo (palabra por palabra) ---

let dialogueIntervalId: number | null = null;

export function typeDialogue(text: string, targetSelector: string): void {
  const dialogueEl = document.querySelector(targetSelector);
  if (dialogueEl === null) {
    return;
  }

  if (dialogueIntervalId !== null) {
    clearInterval(dialogueIntervalId);
  }

  const words = text.split(" ");
  dialogueEl.textContent = "";
  let index = 0;

  dialogueIntervalId = window.setInterval(() => {
    dialogueEl.textContent = words.slice(0, index + 1).join(" ");
    index += 1;
    if (index >= words.length) {
      if (dialogueIntervalId !== null) {
        clearInterval(dialogueIntervalId);
      }
      dialogueIntervalId = null;
    }
  }, 160);
}

// corta el tipeo en curso si lo hay (usado al salir a mitad de un dialogo,
// ver el handler de .exit-to-menu-btn en main.ts) - antes esto lo hacia
// main.ts tocando dialogueIntervalId directo, ahora que vive aca hace falta
// esta funcion para poder cortarlo desde afuera
export function stopDialogue(): void {
  if (dialogueIntervalId !== null) {
    clearInterval(dialogueIntervalId);
    dialogueIntervalId = null;
  }
}
