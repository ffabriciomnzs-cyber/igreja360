'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  Loader2,
  Share,
  Plus,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import {
  getPushState,
  enablePush,
  pushEnvironment,
  PushState,
  PushEnvironment,
} from '@/lib/push';

type Category =
  | 'announcements'
  | 'worship'
  | 'events'
  | 'campaigns'
  | 'birthdays'
  | 'arena';
type Prefs = Record<Category, boolean>;

const CATEGORIAS: { key: Category; label: string; hint: string }[] = [
  {
    key: 'announcements',
    label: 'Avisos da igreja',
    hint: 'Comunicados publicados pela liderança',
  },
  {
    key: 'worship',
    label: 'Cultos',
    hint: 'Novo culto agendado e lembrete no dia',
  },
  { key: 'events', label: 'Eventos', hint: 'Novos eventos da agenda' },
  {
    key: 'campaigns',
    label: 'Campanhas',
    hint: 'Novas campanhas e mutirões',
  },
  {
    key: 'birthdays',
    label: 'Aniversariantes',
    hint: 'Quem faz aniversário hoje',
  },
  {
    key: 'arena',
    label: 'Arena Bíblica',
    hint: 'Quando alguém assume o topo do ranking',
  },
];

const PADRAO: Prefs = {
  announcements: true,
  worship: true,
  events: true,
  campaigns: true,
  birthdays: true,
  arena: true,
};

export default function NotificacoesPage(): React.ReactElement {
  const [state, setState] = useState<PushState | null>(null);
  const [env, setEnv] = useState<PushEnvironment>('ok');
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [busy, setBusy] = useState(false);
  const [salvando, setSalvando] = useState<Category | null>(null);

  useEffect(() => {
    setEnv(pushEnvironment());
    getPushState()
      .then(setState)
      .catch(() => setState('unsupported'));
    memberApi
      .get<Prefs>('/member-auth/push/prefs')
      .then((r) => setPrefs(r.data))
      .catch(() => setPrefs(PADRAO));
  }, []);

  async function ativar(): Promise<void> {
    setBusy(true);
    try {
      setState(await enablePush());
    } catch (e) {
      alert(
        e instanceof Error ? e.message : 'Não foi possível ativar as notificações.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function alternar(key: Category): Promise<void> {
    if (!prefs) return;
    const antes = prefs;
    const novo = { ...prefs, [key]: !prefs[key] };
    setPrefs(novo); // otimista: a UI responde na hora
    setSalvando(key);
    try {
      const { data } = await memberApi.patch<Prefs>('/member-auth/push/prefs', {
        [key]: novo[key],
      });
      setPrefs(data);
    } catch {
      setPrefs(antes); // falhou: volta ao estado anterior
      alert('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Notificações
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Escolha o que você quer receber no celular.
        </p>
      </div>

      {/* Situação atual do aparelho */}
      {env === 'ios-precisa-instalar' ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            <Smartphone className="h-4 w-4" />
            Instale o app para receber notificações
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            No iPhone e no iPad, o Safari só envia notificações quando o portal
            está instalado na tela de início. Toque em{' '}
            <Share className="inline h-3.5 w-3.5 -translate-y-px" />{' '}
            <strong>Compartilhar</strong>, depois em{' '}
            <Plus className="inline h-3.5 w-3.5 -translate-y-px" />{' '}
            <strong>“Adicionar à Tela de Início”</strong> e abra o app por lá.
          </p>
        </div>
      ) : state === 'subscribed' ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          <Check className="h-4 w-4" />
          Notificações ativadas neste aparelho
        </div>
      ) : state === 'denied' ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            Notificações bloqueadas no navegador
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            Toque no <strong>cadeado</strong> (ou no ícone ao lado do endereço),
            abra as permissões do site e mude <strong>Notificações</strong> para
            “Permitir”. Depois recarregue esta página.
          </p>
        </div>
      ) : state === 'unsupported' ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-slate-50 dark:bg-slate-950 p-4 text-sm text-slate-600 dark:text-slate-300">
          <BellOff className="h-4 w-4 shrink-0" />
          Este navegador não suporta notificações.
        </div>
      ) : state === 'available' ? (
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/40 p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notificações desativadas
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Ative para ser avisado sobre cultos, eventos e comunicados.
          </p>
          <button
            onClick={ativar}
            disabled={busy}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Ativar
          </button>
        </div>
      ) : (
        <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      )}

      {/* O que receber */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">O que receber</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-white dark:bg-slate-900">
          {!prefs
            ? CATEGORIAS.map((c) => (
                <div key={c.key} className="h-16 animate-pulse bg-slate-50 dark:bg-slate-950" />
              ))
            : CATEGORIAS.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {c.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.hint}</p>
                  </div>
                  {salvando === c.key && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 dark:text-slate-500" />
                  )}
                  <input
                    type="checkbox"
                    role="switch"
                    checked={prefs[c.key]}
                    onChange={() => void alternar(c.key)}
                    aria-label={c.label}
                    className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700 transition-colors before:block before:h-5 before:w-5 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-indigo-600 checked:before:translate-x-[22px]"
                  />
                </label>
              ))}
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          As preferências valem para todos os seus aparelhos.
        </p>
      </section>
    </div>
  );
}
