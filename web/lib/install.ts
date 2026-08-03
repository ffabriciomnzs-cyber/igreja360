/**
 * Captura única do prompt de instalação do PWA (Android/Chrome).
 *
 * O navegador dispara `beforeinstallprompt` UMA vez por carregamento; quem
 * capturar primeiro fica com ele. Este módulo guarda o evento num lugar só,
 * para o banner de instalação E o tour de boas-vindas usarem o mesmo prompt.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let capturaLigada = false;

export function iniciaCapturaInstalacao(): void {
  if (capturaLigada || typeof window === 'undefined') return;
  capturaLigada = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event('igreja360:install-available'));
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    window.dispatchEvent(new Event('igreja360:installed'));
  });
}

/** O app já roda instalado (modo standalone)? */
export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Dá para disparar o prompt nativo de instalação agora? (Android/Chrome) */
export function podeInstalar(): boolean {
  return deferred !== null;
}

/** Dispara o prompt nativo. Devolve true se o membro aceitou. */
export async function disparaInstalacao(): Promise<boolean> {
  if (!deferred) return false;
  try {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    return outcome === 'accepted';
  } catch {
    deferred = null;
    return false;
  }
}

/** iPhone/iPad no Safari sem estar instalado (instalação é manual)? */
export function ehIosManual(): boolean {
  if (typeof window === 'undefined' || estaInstalado()) return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const ios =
    /iphone|ipad|ipod/.test(ua) ||
    (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios;
}
