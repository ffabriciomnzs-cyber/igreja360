'use client';

import { useCallback, useEffect, useState } from 'react';
import { Share, Plus, Loader2, Bell, Download } from 'lucide-react';
import { getPushState, enablePush } from '@/lib/push';
import {
  estaInstalado,
  podeInstalar,
  disparaInstalacao,
  ehIosManual,
} from '@/lib/install';
import { cn } from '@/lib/utils';

const TOUR_KEY = 'igreja360.tour.done';

/**
 * Tour de boas-vindas: balões guiando o primeiro acesso, terminando nos dois
 * passos que mais importam — instalar o app e ativar as notificações.
 *
 * O destaque é feito com um "furo" na sombra (box-shadow gigante em volta do
 * alvo), então o elemento real fica aceso e o resto escurece. Alvos são
 * marcados com data-tour="..." no layout.
 */
interface Passo {
  alvo: string | null; // seletor [data-tour] ou null = cartão central
  emoji: string;
  titulo: string;
  texto: string;
}

const PASSOS: Passo[] = [
  {
    alvo: null,
    emoji: '👋',
    titulo: 'Bem-vindo ao portal da sua igreja!',
    texto: 'Vamos fazer um passeio rapidinho? Leva menos de um minuto.',
  },
  {
    alvo: 'inicio',
    emoji: '🏠',
    titulo: 'Início',
    texto: 'Avisos, cultos, eventos e campanhas da igreja — tudo num lugar só.',
  },
  {
    alvo: 'devocional',
    emoji: '📖',
    titulo: 'Devocional',
    texto: 'Uma palavra nova todo dia, com versículo e reflexão.',
  },
  {
    alvo: 'arena',
    emoji: '⚔️',
    titulo: 'Arena Bíblica',
    texto: '12 perguntas por dia. Pontue, suba no ranking e desafie a igreja!',
  },
  {
    alvo: 'kids',
    emoji: '🧒',
    titulo: 'Kids',
    texto: 'Joguinhos e conteúdos cristãos para as crianças.',
  },
  {
    alvo: 'perfil',
    emoji: '🪪',
    titulo: 'Seu perfil',
    texto: 'Toque aqui para ver sua carteirinha de membro e seus dados.',
  },
];

export function PortalTour(): React.ReactElement | null {
  const [passo, setPasso] = useState(-1); // -1 = fechado
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [fase, setFase] = useState<'passos' | 'instalar' | 'notificar' | 'fim'>(
    'passos',
  );
  const [ocupado, setOcupado] = useState(false);
  const [instalado, setInstalado] = useState(false);
  const [notificando, setNotificando] = useState(false);

  // Abre no primeiro acesso (ou quando o Perfil pede para rever).
  useEffect(() => {
    const abrir = (): void => {
      setFase('passos');
      setPasso(0);
    };
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        // Pequeno atraso: deixa a Início pintar antes de escurecer a tela.
        const t = setTimeout(abrir, 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignora */
    }
    window.addEventListener('igreja360:abrir-tour', abrir);
    return () => window.removeEventListener('igreja360:abrir-tour', abrir);
  }, []);

  // Mede o alvo do passo atual (e re-mede se a janela mudar).
  useEffect(() => {
    if (passo < 0 || fase !== 'passos') return;
    const alvo = PASSOS[passo]?.alvo;
    if (!alvo) {
      setRect(null);
      return;
    }
    const mede = (): void => {
      const el = document.querySelector(`[data-tour="${alvo}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    mede();
    window.addEventListener('resize', mede);
    return () => window.removeEventListener('resize', mede);
  }, [passo, fase]);

  const termina = useCallback((): void => {
    try {
      localStorage.setItem(TOUR_KEY, String(Date.now()));
    } catch {
      /* ignora */
    }
    setPasso(-1);
  }, []);

  function avanca(): void {
    if (passo < PASSOS.length - 1) {
      setPasso((p) => p + 1);
      return;
    }
    // Acabaram os balões: emenda nos dois passos que valem ouro.
    if (!estaInstalado()) setFase('instalar');
    else setFase('notificar');
  }

  async function instala(): Promise<void> {
    setOcupado(true);
    const aceitou = await disparaInstalacao();
    setOcupado(false);
    if (aceitou) setInstalado(true);
  }

  async function ativaNotificacoes(): Promise<void> {
    setNotificando(true);
    try {
      await enablePush();
    } catch {
      /* o estado da tela de Notificações orienta depois */
    } finally {
      setNotificando(false);
      setFase('fim');
    }
  }

  async function passoNotificar(): Promise<void> {
    // Se já está inscrito, nem oferece — vai direto ao fim.
    const estado = await getPushState().catch(() => 'unsupported');
    if (estado === 'available') setFase('notificar');
    else setFase('fim');
  }

  if (passo < 0) return null;

  const atual = PASSOS[passo];
  const comFuro = fase === 'passos' && rect;
  // Balão acima do alvo se ele está na metade de baixo da tela; senão, abaixo.
  const balaoEmCima = rect ? rect.top > window.innerHeight / 2 : false;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Tour do portal">
      {/* Furo de luz: 4 painéis escuros ao redor do alvo (sombra gigante é
          recortada por alguns navegadores — painéis funcionam sempre). */}
      {comFuro ? (
        <>
          <div
            className="absolute inset-x-0 top-0 bg-slate-900/75"
            style={{ height: Math.max(0, rect.top - 6) }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-slate-900/75"
            style={{ top: rect.bottom + 6 }}
          />
          <div
            className="absolute bg-slate-900/75"
            style={{
              top: rect.top - 6,
              height: rect.height + 12,
              left: 0,
              width: Math.max(0, rect.left - 6),
            }}
          />
          <div
            className="absolute bg-slate-900/75"
            style={{
              top: rect.top - 6,
              height: rect.height + 12,
              left: rect.right + 6,
              right: 0,
            }}
          />
          <div
            className="absolute rounded-2xl ring-4 ring-white/70"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-900/75" />
      )}

      {fase === 'passos' && (
        <div
          className={cn(
            'absolute inset-x-4 mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900',
            !rect
              ? 'top-1/2 -translate-y-1/2'
              : balaoEmCima
                ? ''
                : '',
          )}
          style={
            rect
              ? balaoEmCima
                ? { bottom: window.innerHeight - rect.top + 16 }
                : { top: rect.bottom + 16 }
              : undefined
          }
        >
          <p className="text-3xl">{atual.emoji}</p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">
            {atual.titulo}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {atual.texto}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1">
              {PASSOS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === passo
                      ? 'w-5 bg-indigo-500'
                      : 'w-1.5 bg-slate-200 dark:bg-slate-700',
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={termina}
                className="text-xs font-medium text-slate-400 dark:text-slate-500"
              >
                Pular
              </button>
              <button
                onClick={avanca}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white"
              >
                {passo === PASSOS.length - 1 ? 'Quase lá!' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {fase === 'instalar' && (
        <div className="absolute inset-x-4 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Download className="h-7 w-7" />
          </span>
          <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
            {instalado ? 'App instalado! 🎉' : 'Instale o app da igreja'}
          </p>
          {instalado ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Agora é só abrir pelo ícone na tela inicial.
            </p>
          ) : ehIosManual() ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              No iPhone: toque em{' '}
              <Share className="inline h-4 w-4 -translate-y-px text-indigo-500" />{' '}
              <strong>Compartilhar</strong> e depois em{' '}
              <Plus className="inline h-4 w-4 -translate-y-px text-indigo-500" />{' '}
              <strong>“Adicionar à Tela de Início”</strong>. Sem isso, o iPhone
              não entrega as notificações da igreja!
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Com o app na tela inicial, a igreja fica a um toque — e as
              notificações chegam direitinho.
            </p>
          )}
          <div className="mt-4 flex flex-col items-center gap-2">
            {!instalado && podeInstalar() && (
              <button
                onClick={() => void instala()}
                disabled={ocupado}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
                Instalar agora
              </button>
            )}
            <button
              onClick={() => void passoNotificar()}
              className="w-full rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {fase === 'notificar' && (
        <div className="absolute inset-x-4 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <Bell className="h-7 w-7" />
          </span>
          <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
            Fique por dentro de tudo
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Cultos, eventos, avisos e o ranking da Arena — direto no seu
            celular. É o jeito de não perder nada da igreja.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={() => void ativaNotificacoes()}
              disabled={notificando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {notificando && <Loader2 className="h-4 w-4 animate-spin" />}
              Ativar notificações
            </button>
            <button
              onClick={() => setFase('fim')}
              className="text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      {fase === 'fim' && (
        <div className="absolute inset-x-4 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white shadow-2xl">
          <p className="text-5xl">🎉</p>
          <p className="mt-2 text-xl font-bold">Tudo pronto!</p>
          <p className="mt-1 text-sm text-indigo-100">
            O portal é seu. Comece pelo desafio de hoje na Arena!
          </p>
          <button
            onClick={termina}
            className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700"
          >
            Começar a usar
          </button>
        </div>
      )}
    </div>
  );
}
