'use client';

// "Estou aqui" — presença no culto, na tela inicial do portal.
//
// O cartão só aparece perto do culto (a API decide a janela). Fora dela, o
// membro não vê nada: um botão de presença sempre disponível viraria um
// número sem significado para a liderança.

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, MapPin, Users } from 'lucide-react';
import { memberApi, memberApiError } from '@/lib/member-api';

interface Janela {
  aberto: boolean;
  nome: string | null;
  abreEm: string | null;
  fechaEm: string | null;
}

interface StatusPresenca {
  window: Janela;
  checkedIn: boolean;
  todayCount: number;
  myMonthCount: number;
}

export function EstouAqui(): React.ReactElement | null {
  const [dados, setDados] = useState<StatusPresenca | null>(null);
  const [marcando, setMarcando] = useState(false);
  const [erro, setErro] = useState('');

  const carrega = useCallback(() => {
    memberApi
      .get<StatusPresenca>('/member-auth/attendance')
      .then((r) => setDados(r.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  async function marca(): Promise<void> {
    setMarcando(true);
    setErro('');
    try {
      const { data } = await memberApi.post<StatusPresenca>(
        '/member-auth/attendance',
      );
      setDados(data);
    } catch (err) {
      setErro(memberApiError(err));
    } finally {
      setMarcando(false);
    }
  }

  if (!dados) return null;
  const { window: janela, checkedIn, todayCount, myMonthCount } = dados;

  // Fora da janela: só avisa o horário se houver culto mais tarde hoje.
  if (!janela.aberto) {
    if (!janela.abreEm) return null;
    return (
      <div className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {janela.nome ?? 'Culto de hoje'}
        </p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          O check-in de presença abre às {janela.abreEm}.
        </p>
      </div>
    );
  }

  if (checkedIn) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              Presença confirmada!
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {todayCount === 1
                ? 'Você é a primeira pessoa hoje.'
                : `Você e mais ${todayCount - 1} ${todayCount - 1 === 1 ? 'irmão' : 'irmãos'} no culto de hoje.`}
            </p>
          </div>
        </div>
        {myMonthCount > 1 && (
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            {myMonthCount} cultos neste mês. Que Deus te abençoe!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 p-4 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-indigo-200" />
        <p className="text-sm font-semibold">{janela.nome ?? 'Culto de hoje'}</p>
      </div>
      <p className="mt-1 text-sm text-indigo-100">
        Está no culto? Confirme sua presença.
      </p>

      <button
        onClick={marca}
        disabled={marcando}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-indigo-700 disabled:opacity-70"
      >
        {marcando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Estou aqui
      </button>

      {todayCount > 0 && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-indigo-200">
          <Users className="h-3 w-3" />
          {todayCount} {todayCount === 1 ? 'presença' : 'presenças'} até agora
        </p>
      )}
      {erro && (
        <p className="mt-2 rounded-lg bg-white/15 px-3 py-2 text-xs">{erro}</p>
      )}
    </div>
  );
}
