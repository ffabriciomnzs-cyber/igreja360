'use client';

// "Como você quer desafiar?" — a folha que faltava.
//
// Antes o botão fazia tudo de uma vez: criava o desafio e tentava compartilhar
// na mesma ação. Agora são dois passos, e o segundo nasce de um toque próprio
// (exigência do iOS para abrir a folha de compartilhamento).

import { useEffect, useState } from 'react';
import { UserRound, Link2, Loader2, Check, Search, X } from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import {
  criaDesafio,
  compartilha,
  linkDoWhatsApp,
  type DesafioCriado,
} from '@/lib/arena-duelo';

interface Irmao {
  id: string;
  name: string;
  photo: string | null;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

type Passo = 'escolha' | 'membros' | 'convite';

export function DesafiarSheet({
  base,
  meuNome,
  onFechar,
}: {
  base: string;
  meuNome: string;
  onFechar: (criou: boolean) => void;
}): React.ReactElement {
  const [passo, setPasso] = useState<Passo>('escolha');
  const [busca, setBusca] = useState('');
  const [irmaos, setIrmaos] = useState<Irmao[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [convite, setConvite] = useState<DesafioCriado | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);

  useEffect(() => {
    if (passo !== 'membros') return;
    memberApi
      .get<Irmao[]>('/member-auth/arena/duels/members', {
        params: busca.trim().length >= 2 ? { search: busca.trim() } : {},
      })
      .then((r) => setIrmaos(r.data))
      .catch(() => setErro('Não foi possível carregar a lista agora.'));
  }, [passo, busca]);

  async function desafiaMembro(irmao: Irmao): Promise<void> {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    try {
      await criaDesafio(base, meuNome, irmao.id);
      setEnviado(irmao.name.split(' ')[0]);
    } catch {
      setErro('Não deu para enviar o desafio. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  async function criaLink(): Promise<void> {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    try {
      setConvite(await criaDesafio(base, meuNome));
      setPasso('convite');
    } catch {
      setErro('Não deu para criar o convite. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  async function envia(): Promise<void> {
    if (!convite) return;
    const como = await compartilha(convite);
    if (como === 'copiado') setAviso('Link do desafio copiado.');
    else if (como === 'falhou') setAviso('Copie o link abaixo e mande para quem quiser.');
    else if (como === 'compartilhado') onFechar(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/60 p-3">
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {enviado
              ? 'Desafio enviado!'
              : passo === 'membros'
                ? 'Escolha um irmão'
                : passo === 'convite'
                  ? 'Convite pronto'
                  : 'Como você quer desafiar?'}
          </h2>
          <button
            onClick={() => onFechar(!!enviado || !!convite)}
            aria-label="Fechar"
            className="rounded-lg p-1 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {erro && (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {erro}
          </p>
        )}

        {enviado ? (
          <div className="py-2 text-center">
            <Check className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {enviado} recebeu o convite no app e vai ser avisado no celular.
            </p>
            <button
              onClick={() => onFechar(true)}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
            >
              Fechar
            </button>
          </div>
        ) : passo === 'escolha' ? (
          <div className="space-y-2">
            <button
              onClick={() => setPasso('membros')}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left dark:border-slate-700"
            >
              <UserRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Escolher um membro
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ele recebe o convite no app
                </span>
              </span>
            </button>
            <button
              onClick={() => void criaLink()}
              disabled={ocupado}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left disabled:opacity-60 dark:border-slate-700"
            >
              {ocupado ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <Link2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Compartilhar convite
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Um link para mandar a quem quiser
                </span>
              </span>
            </button>
          </div>
        ) : passo === 'membros' ? (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar pelo nome"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {irmaos.map((i) => (
                <button
                  key={i.id}
                  onClick={() => void desafiaMembro(i)}
                  disabled={ocupado}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left disabled:opacity-60 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {i.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.photo} alt={i.name} className="h-full w-full object-cover" />
                    ) : (
                      iniciais(i.name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                    {i.name}
                  </span>
                </button>
              ))}
              {irmaos.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  Ninguém encontrado.
                </p>
              )}
            </div>
          </div>
        ) : (
          convite && (
            <div>
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs break-all text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {convite.link}
              </p>
              {aviso && (
                <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {aviso}
                </p>
              )}
              <button
                onClick={() => void envia()}
                className="mt-3 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white"
              >
                Compartilhar
              </button>
              <a
                href={linkDoWhatsApp(convite)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                Enviar pelo WhatsApp
              </a>
            </div>
          )
        )}
      </div>
    </div>
  );
}
