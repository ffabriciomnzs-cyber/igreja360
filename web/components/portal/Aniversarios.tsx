'use client';

// Aniversários na tela inicial do portal.
// Dois papéis na mesma tela: quem parabeniza (cartão do aniversariante) e
// quem faz aniversário (mural com os recados que a igreja deixou).
//
// ⚠️ Privacidade: o telefone NUNCA vem na listagem. O botão do WhatsApp pede
// o link ao servidor na hora do clique — um número por vez, e só no dia.

import { useCallback, useEffect, useState } from 'react';
import { Cake, PartyPopper, Loader2, Check } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface Aniversariante {
  memberId: string;
  name: string;
  photo: string | null;
  isMe: boolean;
  greetings: number;
  iGreeted: boolean;
  greeters: { name: string; photo: string | null }[];
}

interface DaSemana {
  memberId: string;
  name: string;
  photo: string | null;
  month: number;
  day: number;
}

interface Recado {
  authorName: string;
  authorPhoto: string | null;
  message: string;
  createdAt: string;
}

interface Aniversarios {
  today: Aniversariante[];
  week: DaSemana[];
  mine: { total: number; messages: Recado[] } | null;
}

const SUGESTAO = 'Feliz aniversário! Que Deus te abençoe muito. 🎉';

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** "quinta" ou "12/09" se estiver mais longe. */
function quando(month: number, day: number): string {
  const hoje = new Date(Date.now() - 3 * 3600_000);
  const alvo = new Date(Date.UTC(hoje.getUTCFullYear(), month - 1, day, 12));
  const dias = Math.round(
    (alvo.getTime() -
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate(), 12)) /
      86_400_000,
  );
  if (dias === 1) return 'amanhã';
  if (dias > 1 && dias <= 6) return DIAS[alvo.getUTCDay()];
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

function Avatar({
  nome,
  foto,
  tamanho = 'md',
}: {
  nome: string;
  foto: string | null;
  tamanho?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  const classes =
    tamanho === 'lg'
      ? 'h-[72px] w-[72px] text-xl'
      : tamanho === 'sm'
        ? 'h-6 w-6 text-[10px]'
        : 'h-8 w-8 text-[11px]';
  return (
    <div
      className={`flex ${classes} shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={nome} className="h-full w-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </div>
  );
}

export function Aniversarios(): React.ReactElement | null {
  const [dados, setDados] = useState<Aniversarios | null>(null);
  const [escrevendo, setEscrevendo] = useState<string | null>(null);
  const [texto, setTexto] = useState(SUGESTAO);
  const [enviando, setEnviando] = useState(false);

  const carrega = useCallback(() => {
    memberApi
      .get<Aniversarios>('/member-auth/birthdays')
      .then((r) => setDados(r.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  async function parabeniza(memberId: string): Promise<void> {
    setEnviando(true);
    try {
      await memberApi.post(`/member-auth/birthdays/${memberId}/greet`, {
        message: texto.trim() || SUGESTAO,
      });
      setEscrevendo(null);
      setTexto(SUGESTAO);
      carrega();
    } catch {
      /* ignora */
    } finally {
      setEnviando(false);
    }
  }

  /** Pede o link ao servidor só quando a pessoa clica (um número por vez). */
  async function abreWhatsapp(memberId: string): Promise<void> {
    try {
      const { data } = await memberApi.get<{ url: string | null }>(
        `/member-auth/birthdays/${memberId}/whatsapp`,
      );
      if (data.url) window.open(data.url, '_blank', 'noopener');
    } catch {
      /* ignora */
    }
  }

  if (!dados) return null;
  const { today, week, mine } = dados;
  const outros = today.filter((a) => !a.isMe);
  if (!outros.length && !week.length && !mine) return null;

  return (
    <div className="space-y-3">
      {/* É o meu aniversário: os recados da igreja para mim */}
      {mine && (
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-900 dark:bg-slate-900">
          <div className="bg-indigo-50 px-5 py-4 text-center dark:bg-indigo-950/50">
            <p className="text-3xl">🎂</p>
            <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
              Feliz aniversário!
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {mine.total === 0
                ? 'Hoje é o seu dia. A igreja está com você!'
                : mine.total === 1
                  ? 'A igreja deixou 1 recado para você'
                  : `A igreja deixou ${mine.total} recados para você`}
            </p>
          </div>
          {mine.messages.map((r, i) => (
            <div
              key={`${r.authorName}-${i}`}
              className="flex gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <Avatar nome={r.authorName} foto={r.authorPhoto} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {r.authorName}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {r.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aniversariantes de hoje: parabenizar */}
      {(outros.length > 0 || week.length > 0) && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <Cake className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Aniversários
            </span>
          </div>

          {outros.map((a) => (
            <div key={a.memberId} className="px-5 py-4 text-center">
              <div className="mx-auto w-fit">
                <Avatar nome={a.name} foto={a.photo} tamanho="lg" />
              </div>
              <p className="mt-2.5 text-base font-semibold text-slate-900 dark:text-slate-100">
                {a.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                faz aniversário hoje
              </p>

              {escrevendo === a.memberId ? (
                <div className="mt-3 space-y-2 text-left">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    maxLength={300}
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => parabeniza(a.memberId)}
                      disabled={enviando}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
                    >
                      {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                      Enviar recado
                    </button>
                    <button
                      onClick={() => setEscrevendo(null)}
                      className="rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-500 dark:border-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setTexto(SUGESTAO);
                      setEscrevendo(a.memberId);
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ${
                      a.iGreeted
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                  >
                    {a.iGreeted ? (
                      <>
                        <Check className="h-4 w-4" />
                        Você parabenizou
                      </>
                    ) : (
                      <>
                        <PartyPopper className="h-4 w-4" />
                        Parabenizar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => abreWhatsapp(a.memberId)}
                    title="Mandar mensagem no WhatsApp"
                    className="flex w-12 items-center justify-center rounded-xl border border-slate-200 text-emerald-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5v-.5c-.1-.2-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7.2 3.9z" />
                    </svg>
                  </button>
                </div>
              )}

              {a.greetings > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="flex">
                    {a.greeters.map((g, i) => (
                      <div
                        key={`${g.name}-${i}`}
                        className="-ml-2 first:ml-0 rounded-full ring-2 ring-white dark:ring-slate-900"
                      >
                        <Avatar nome={g.name} foto={g.photo} tamanho="sm" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {a.greetings === 1
                      ? '1 já parabenizou'
                      : `${a.greetings} já parabenizaram`}
                  </span>
                </div>
              )}
            </div>
          ))}

          {week.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                Ainda esta semana
              </p>
              <div className="space-y-2">
                {week.map((p) => (
                  <div key={p.memberId} className="flex items-center gap-3">
                    <Avatar nome={p.name} foto={p.photo} />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                      {primeiroNome(p.name)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {quando(p.month, p.day)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
