// Leitura em voz alta usando a voz do próprio aparelho (Web Speech API).
// Sem servidor, sem custo e funciona offline. Em aparelhos sem suporte, o
// botão de ouvir simplesmente não aparece.

export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

/** Melhor voz em português disponível no aparelho (null se não houver). */
function vozPtBr(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  if (!vozes.length) return null;
  const ptBr = vozes.filter((v) => /^pt[-_]BR/i.test(v.lang));
  const pt = vozes.filter((v) => /^pt/i.test(v.lang));
  // Vozes "premium"/"enhanced" da Apple soam bem melhor quando existem.
  const preferida = [...ptBr, ...pt].find((v) =>
    /(luciana|francisca|premium|enhanced|natural)/i.test(v.name),
  );
  return preferida ?? ptBr[0] ?? pt[0] ?? null;
}

export function stopSpeaking(): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}

/**
 * Lê o texto em voz alta. Chama `onEnd` ao terminar (ou ao falhar), para a
 * tela voltar o botão para "ouvir".
 */
export function speak(text: string, onEnd?: () => void): void {
  if (!speechSupported() || !text.trim()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();

  const iniciar = (): void => {
    // Trechos longos travam em alguns navegadores: quebra por frase.
    const partes = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    let restantes = partes.length;
    partes.forEach((parte) => {
      const fala = new SpeechSynthesisUtterance(parte.trim());
      const voz = vozPtBr();
      if (voz) fala.voice = voz;
      fala.lang = voz?.lang ?? 'pt-BR';
      fala.rate = 0.95;
      fala.pitch = 1;
      const terminou = (): void => {
        restantes -= 1;
        if (restantes <= 0) onEnd?.();
      };
      fala.onend = terminou;
      fala.onerror = terminou;
      window.speechSynthesis.speak(fala);
    });
  };

  // No primeiro uso a lista de vozes pode ainda não ter carregado.
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      iniciar();
    };
    // Se o evento não vier, começa mesmo assim com a voz padrão.
    setTimeout(() => {
      if (!window.speechSynthesis.speaking) iniciar();
    }, 600);
    return;
  }
  iniciar();
}
