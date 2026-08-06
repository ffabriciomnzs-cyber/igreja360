'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Loader2,
  CalendarDays,
  CalendarClock,
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
import { MuralOracao } from '@/components/portal/MuralOracao';
import { eventPhotoSrc } from '@/lib/events';
import { Swords, Trophy } from 'lucide-react';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
    endDate: string | null;
    location: string | null;
    type: string | null;
    photoUrl: string | null;
  }[];
  schedules: {
    id: string;
    weekday: number;
    time: string;
    name: string;
    note: string | null;
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
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
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


interface ArenaRankRow {
  position: number;
  name: string;
  photo: string | null;
  points: number;
  me: boolean;
}
interface ArenaRanking {
  top: ArenaRankRow[];
  me: { position: number | null; points: number };
}

function arenaIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Pódio do mês na Início: mostra o topo e convida para o desafio do dia. */
function ArenaDestaque({ base }: { base: string }): React.ReactElement | null {
  const { data } = useCached<ArenaRanking>('arena-ranking-mes', () =>
    memberApi
      .get<ArenaRanking>('/member-auth/arena/ranking', {
        params: { period: 'month' },
      })
      .then((r) => r.data),
  );

  const podio = data?.top.slice(0, 3) ?? [];
  const MEDALHAS = ['🥇', '🥈', '🥉'];

  return (
    <Link
      href={`${base}/arena`}
      className="block rounded-2xl border border-indigo-100 bg-white p-4 transition-colors hover:border-indigo-300 dark:border-indigo-900 dark:bg-slate-900 dark:hover:border-indigo-700"
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Swords className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Arena Bíblica
        </p>
        <span className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          Jogar hoje
        </span>
      </div>

      {podio.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          12 perguntas por dia. Seja a primeira pessoa no ranking do mês! 🏆
        </p>
      ) : (
        <div className="mt-3 space-y-1.5">
          {podio.map((linha, i) => (
            <div key={linha.position} className="flex items-center gap-2.5">
              <span className="w-6 text-center text-sm">{MEDALHAS[i]}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                {linha.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={linha.photo}
                    alt={linha.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  arenaIniciais(linha.name)
                )}
              </span>
              <span
                className={
                  'min-w-0 flex-1 truncate text-sm ' +
                  (linha.me
                    ? 'font-bold text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300')
                }
              >
                {linha.name}
                {linha.me ? ' (você)' : ''}
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {linha.points}
                <span className="ml-0.5 text-[10px] font-normal text-slate-400 dark:text-slate-500">
                  pts
                </span>
              </span>
            </div>
          ))}
          {data?.me.position != null && data.me.position > 3 && (
            <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
              <Trophy className="mr-1 inline h-3 w-3 text-amber-500" />
              Você está em {data.me.position}º com {data.me.points} pts —
              responda hoje e suba!
            </p>
          )}
        </div>
      )}
    </Link>
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
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
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

      {/* Arena: pódio do mês na abertura — competição à vista todo dia */}
      <ArenaDestaque base={base} />

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
                className="rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 p-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Oração: o pedido fica à mão na abertura, sem entrar no Perfil */}
      <MuralOracao />

      {/* Campanhas */}
      <section>
        <SectionTitle icon={Megaphone} color="bg-rose-500">
          Campanhas
        </SectionTitle>
        {data.campaigns.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 text-sm text-slate-400 dark:text-slate-500">
            Nenhuma campanha ativa no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {data.campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</p>
                    {c.description && (
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                {c.goal > 0 && (
                  <div className="mt-3">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-rose-600">
                        {formatCurrency(c.current)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">
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

      {/* Agenda fixa: o que se repete toda semana */}
      {data.schedules?.length > 0 && (
        <section>
          <SectionTitle icon={CalendarClock} color="bg-violet-500">
            Agenda da semana
          </SectionTitle>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
            {data.schedules.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-3">
                <div className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                  <span className="text-[11px] font-bold uppercase leading-none text-violet-600 dark:text-violet-300">
                    {DIAS_CURTOS[h.weekday]}
                  </span>
                  <span className="mt-0.5 text-xs font-semibold leading-none text-violet-500 dark:text-violet-400">
                    {h.time}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {h.name}
                  </p>
                  {h.note && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {h.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Próximos cultos */}
      <section>
        <SectionTitle icon={ClipboardList} color="bg-indigo-500">
          Próximos cultos
        </SectionTitle>
        {data.worship.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 text-sm text-slate-400 dark:text-slate-500">
            Nenhum culto programado.
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.worship.map((w) => (
              <div
                key={w.id}
                className="flex gap-3 rounded-2xl border border-border bg-white dark:bg-slate-900 p-3 shadow-sm"
              >
                <DateBadge iso={w.date} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{w.title}</p>
                  {w.theme && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {w.theme}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500">
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
          <p className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 text-sm text-slate-400 dark:text-slate-500">
            Nenhum evento programado.
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.events.map((ev) => {
              const cartaz = eventPhotoSrc(ev);
              return (
                <Link
                  key={ev.id}
                  href={`${base}/eventos/${ev.id}`}
                  className="block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                >
                  {/* Cartaz INTEIRO, na proporção em que a igreja criou (uns
                      são quadrados, outros em pé): cortar escondia parte da
                      arte. O teto de altura evita que um cartaz muito
                      comprido tome a tela toda. */}
                  {cartaz && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cartaz}
                      alt={ev.name}
                      loading="lazy"
                      className="max-h-[440px] w-full bg-slate-100 object-contain dark:bg-slate-800"
                    />
                  )}
                  <div className="flex gap-3 p-3">
                    <DateBadge iso={ev.date} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {ev.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500">
                        <span>{dateBadge(ev.date).time}</span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 self-center text-slate-300 dark:text-slate-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
