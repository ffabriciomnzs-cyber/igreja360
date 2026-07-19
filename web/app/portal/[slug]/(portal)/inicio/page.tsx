'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2,
  CalendarDays,
  ClipboardList,
  Megaphone,
  BookOpen,
  Sparkles,
  MapPin,
  ChevronRight,
  Heart,
  Bell,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { formatCurrency } from '@/lib/utils';
import { useCached } from '@/lib/use-cached';
import { EnableNotifications } from '@/components/portal/EnableNotifications';

interface PortalHome {
  announcements: {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
  }[];
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

function dateBadge(iso: string): { day: string; mon: string; time: string } {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(d),
    mon: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(d)
      .replace('.', '')
      .toUpperCase(),
    time: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d),
  };
}

function SectionTitle({
  icon: Icon,
  color,
  children,
}: {
  icon: typeof Megaphone;
  color: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${color}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  );
}

function DateBadge({ iso }: { iso: string }): React.ReactElement {
  const b = dateBadge(iso);
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
      <span className="text-lg font-bold leading-none">{b.day}</span>
      <span className="text-[10px] font-medium leading-none opacity-90">
        {b.mon}
      </span>
    </div>
  );
}

export default function PortalInicioPage(): React.ReactElement {
  const params = useParams();
  const slug = String(params.slug);
  const base = `/portal/${slug}`;
  // Cache + revalidação em segundo plano: ao voltar para esta aba a tela
  // aparece na hora com o conteúdo anterior, sem "Carregando...".
  const { data, loading } = useCached<PortalHome>('portal-home', () =>
    memberApi.get<PortalHome>('/member-auth/home').then((r) => r.data),
  );

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
      <EnableNotifications />

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`${base}/devocional`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 text-white shadow-lg"
        >
          <Sparkles className="absolute -right-3 -top-3 h-16 w-16 text-white/10" />
          <BookOpen className="h-6 w-6" />
          <p className="mt-6 text-sm font-semibold leading-tight">
            Devocional
            <br />
            de hoje
          </p>
          <span className="mt-1 flex items-center text-xs text-indigo-200">
            Abrir <ChevronRight className="h-3 w-3" />
          </span>
        </Link>
        <Link
          href={`${base}/biblia`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 p-4 text-white shadow-lg"
        >
          <BookOpen className="absolute -right-3 -top-3 h-16 w-16 text-white/10" />
          <BookOpen className="h-6 w-6" />
          <p className="mt-6 text-sm font-semibold leading-tight">
            Bíblia
            <br />
            Sagrada
          </p>
          <span className="mt-1 flex items-center text-xs text-violet-200">
            Ler <ChevronRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      {/* Avisos */}
      {data.announcements.length > 0 && (
        <section>
          <SectionTitle icon={Bell} color="bg-indigo-500">
            Avisos da igreja
          </SectionTitle>
          <div className="space-y-2">
            {data.announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Campanhas */}
      <section>
        <SectionTitle icon={Megaphone} color="bg-rose-500">
          Campanhas
        </SectionTitle>
        {data.campaigns.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-4 text-sm text-slate-400">
            Nenhuma campanha ativa no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {data.campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{c.title}</p>
                    {c.description && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                {c.goal > 0 && (
                  <div className="mt-3">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-rose-600">
                        {formatCurrency(c.current)}
                      </span>
                      <span className="text-slate-400">
                        Meta: {formatCurrency(c.goal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Próximos cultos */}
      <section>
        <SectionTitle icon={ClipboardList} color="bg-indigo-500">
          Próximos cultos
        </SectionTitle>
        {data.worship.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-4 text-sm text-slate-400">
            Nenhum culto programado.
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.worship.map((w) => (
              <div
                key={w.id}
                className="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"
              >
                <DateBadge iso={w.date} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{w.title}</p>
                  {w.theme && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {w.theme}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                    <span>{dateBadge(w.date).time}</span>
                    {w.bibleRef && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {w.bibleRef}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Próximos eventos */}
      <section>
        <SectionTitle icon={CalendarDays} color="bg-emerald-500">
          Próximos eventos
        </SectionTitle>
        {data.events.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-4 text-sm text-slate-400">
            Nenhum evento programado.
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.events.map((ev) => (
              <div
                key={ev.id}
                className="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"
              >
                <DateBadge iso={ev.date} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{ev.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                    <span>{dateBadge(ev.date).time}</span>
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
