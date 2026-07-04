'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  CalendarDays,
  ClipboardList,
  Megaphone,
  BookOpen,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface PortalHome {
  worship: {
    id: string;
    title: string;
    date: string;
    theme: string | null;
    bibleRef: string | null;
  }[];
  events: {
    id: string;
    name: string;
    date: string;
    location: string | null;
    type: string | null;
  }[];
  campaigns: {
    id: string;
    title: string;
    description: string | null;
    goal: number;
    current: number;
    progress: number;
  }[];
}

export default function PortalInicioPage(): React.ReactElement {
  const [data, setData] = useState<PortalHome | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    memberApi
      .get<PortalHome>('/member-auth/home')
      .then(({ data }) => {
        if (mounted) setData(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }
  if (!data) return <></>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Megaphone className="h-4 w-4 text-indigo-600" />
          Campanhas
        </h2>
        {data.campaigns.length === 0 ? (
          <p className="rounded-lg border border-border bg-white p-4 text-sm text-slate-400">
            Nenhuma campanha ativa no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {data.campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-white p-4"
              >
                <p className="font-medium text-slate-900">{c.title}</p>
                {c.description && (
                  <p className="mt-1 text-sm text-slate-500">{c.description}</p>
                )}
                {c.goal > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{formatCurrency(c.current)}</span>
                      <span>Meta: {formatCurrency(c.goal)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <ClipboardList className="h-4 w-4 text-indigo-600" />
          Próximos cultos
        </h2>
        {data.worship.length === 0 ? (
          <p className="rounded-lg border border-border bg-white p-4 text-sm text-slate-400">
            Nenhum culto programado.
          </p>
        ) : (
          <div className="space-y-2">
            {data.worship.map((w) => (
              <div
                key={w.id}
                className="rounded-lg border border-border bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{w.title}</p>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDateTime(w.date)}
                  </span>
                </div>
                {w.theme && (
                  <p className="mt-1 text-sm text-slate-600">{w.theme}</p>
                )}
                {w.bibleRef && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <BookOpen className="h-3 w-3" />
                    {w.bibleRef}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <CalendarDays className="h-4 w-4 text-indigo-600" />
          Próximos eventos
        </h2>
        {data.events.length === 0 ? (
          <p className="rounded-lg border border-border bg-white p-4 text-sm text-slate-400">
            Nenhum evento programado.
          </p>
        ) : (
          <div className="space-y-2">
            {data.events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border border-border bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{ev.name}</p>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDateTime(ev.date)}
                  </span>
                </div>
                {ev.location && (
                  <p className="mt-1 text-sm text-slate-500">{ev.location}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
