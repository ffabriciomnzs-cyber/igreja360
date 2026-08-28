'use client';

// "Minha escala" na tela inicial: onde e quando eu sirvo, com confirmação.
// Hoje o voluntário descobre isso por print em grupo de WhatsApp — aqui ele
// vê, confirma, e o líder sabe antes do culto quem vai faltar.

import { useCallback, useEffect, useState } from 'react';
import { HandHelping, Check, X, Loader2 } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

type Status = 'PENDING' | 'CONFIRMED' | 'DECLINED';

interface Escala {
  id: string;
  date: string;
  teamName: string;
  role: string | null;
  status: Status;
}

function quando(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export function MinhaEscala(): React.ReactElement | null {
  const [itens, setItens] = useState<Escala[]>([]);
  const [respondendo, setRespondendo] = useState<string | null>(null);

  const carrega = useCallback(() => {
    memberApi
      .get<Escala[]>('/member-auth/schedule')
      .then((r) => setItens(r.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  async function responde(id: string, confirm: boolean): Promise<void> {
    setRespondendo(id);
    try {
      const { data } = await memberApi.post<Escala[]>(
        `/member-auth/schedule/${id}/respond`,
        { confirm },
      );
      setItens(data);
    } catch {
      /* ignora */
    } finally {
      setRespondendo(null);
    }
  }

  if (!itens.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <HandHelping className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Minha escala
        </span>
      </div>

      {itens.map((e) => (
        <div
          key={e.id}
          className="border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {e.teamName}
            {e.role ? ` · ${e.role}` : ''}
          </p>
          <p className="mt-0.5 text-sm capitalize text-slate-500 dark:text-slate-400">
            {quando(e.date)}
          </p>

          {e.status === 'PENDING' ? (
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => responde(e.id, true)}
                disabled={respondendo === e.id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {respondendo === e.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirmo
              </button>
              <button
                onClick={() => responde(e.id, false)}
                disabled={respondendo === e.id}
                className="rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400"
              >
                Não posso
              </button>
            </div>
          ) : e.status === 'CONFIRMED' ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              Presença confirmada
            </p>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                <X className="h-4 w-4" />
                Você avisou que não pode
              </p>
              <button
                onClick={() => responde(e.id, true)}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
              >
                Mudei de ideia
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
