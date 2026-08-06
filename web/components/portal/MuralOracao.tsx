'use client';

import { useEffect, useState } from 'react';
import { HandHeart, Loader2, Plus, Check } from 'lucide-react';
import { memberApi } from '@/lib/member-api';

interface SharedPrayer {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  authorName: string | null;
  authorPhoto: string | null;
  prayingCount: number;
  iAmPraying: boolean;
  isMine: boolean;
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0])
    .toUpperCase();
}

function quando(iso: string): string {
  const dias = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86400000,
  );
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Mural de oração da tela inicial: o membro envia o pedido em dois toques e
 * vê os pedidos que a igreja compartilhou, para orar uns pelos outros.
 * Pedido não compartilhado não aparece aqui — só a liderança vê.
 */
export function MuralOracao(): React.ReactElement {
  const [lista, setLista] = useState<SharedPrayer[]>([]);
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [detalhe, setDetalhe] = useState('');
  const [compartilhar, setCompartilhar] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const carrega = (): void => {
    memberApi
      .get<SharedPrayer[]>('/member-auth/prayers/shared')
      .then(({ data }) => setLista(data))
      .catch(() => undefined);
  };

  useEffect(carrega, []);

  async function enviar(): Promise<void> {
    if (titulo.trim().length < 2) return;
    setSalvando(true);
    try {
      await memberApi.post('/member-auth/prayers', {
        title: titulo.trim(),
        description: detalhe.trim() || undefined,
        isPublic: compartilhar,
      });
      setTitulo('');
      setDetalhe('');
      setEnviado(true);
      setAberto(false);
      if (compartilhar) carrega();
      setTimeout(() => setEnviado(false), 4000);
    } catch {
      /* ignora */
    } finally {
      setSalvando(false);
    }
  }

  async function alternaOracao(pedido: SharedPrayer): Promise<void> {
    // Responde na hora e conserta depois se a API recusar — o toque não pode
    // parecer travado.
    setLista((atual) =>
      atual.map((p) =>
        p.id === pedido.id
          ? {
              ...p,
              iAmPraying: !p.iAmPraying,
              prayingCount: p.prayingCount + (p.iAmPraying ? -1 : 1),
            }
          : p,
      ),
    );
    try {
      const { data } = await memberApi.post<{
        prayingCount: number;
        iAmPraying: boolean;
      }>(`/member-auth/prayers/${pedido.id}/praying`);
      setLista((atual) =>
        atual.map((p) => (p.id === pedido.id ? { ...p, ...data } : p)),
      );
    } catch {
      setLista((atual) =>
        atual.map((p) => (p.id === pedido.id ? { ...pedido } : p)),
      );
    }
  }

  return (
    <section data-tour="oracao">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500 text-white">
          <HandHeart className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Mural de oração
        </h2>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-white dark:bg-slate-900 p-4">
        {enviado && (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            Pedido enviado. A igreja vai orar com você!
          </p>
        )}

        {aberto ? (
          <div className="space-y-3">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Pelo que a igreja pode orar?"
              maxLength={160}
              autoFocus
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
            <textarea
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              placeholder="Conte mais, se quiser (opcional)"
              maxLength={2000}
              className="min-h-[70px] w-full resize-y rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
            <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={compartilhar}
                onChange={(e) => setCompartilhar(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>
                Compartilhar no mural com a igreja.
                <br />
                Se desmarcar, só a liderança vê o seu pedido.
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={enviar}
                disabled={salvando || titulo.trim().length < 2}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar pedido
              </button>
              <button
                onClick={() => setAberto(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAberto(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Enviar pedido de oração
          </button>
        )}

        {lista.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lista.map((p) => (
              <li key={p.id} className="flex gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 dark:bg-teal-950/50 text-xs font-bold text-teal-700 dark:text-teal-400">
                  {p.authorPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.authorPhoto}
                      alt={p.authorName ?? 'Membro'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    iniciais(p.authorName ?? 'Igreja')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {p.title}
                  </p>
                  {p.description && (
                    <p className="mt-0.5 whitespace-pre-line text-xs text-slate-500 dark:text-slate-400">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {p.authorName ?? 'Um irmão'} · {quando(p.createdAt)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    {p.isMine ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                        <HandHeart className="h-3.5 w-3.5" />
                        {p.prayingCount > 0
                          ? `${p.prayingCount} ${p.prayingCount === 1 ? 'irmão está orando' : 'irmãos estão orando'} por você`
                          : 'Seu pedido'}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => alternaOracao(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            p.iAmPraying
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'border border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/50'
                          }`}
                        >
                          <HandHeart className="h-3.5 w-3.5" />
                          {p.iAmPraying ? 'Estou orando' : 'Vou orar'}
                        </button>
                        {p.prayingCount > 0 && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {p.prayingCount}{' '}
                            {p.prayingCount === 1 ? 'orando' : 'orando'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
            Nenhum pedido compartilhado ainda. Seja o primeiro a pedir oração.
          </p>
        )}
      </div>
    </section>
  );
}
