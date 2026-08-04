'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Calendar,
  Cake,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Landmark,
  Megaphone,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PortalPendingAlert } from '@/components/PortalPendingAlert';
import { AdminNotifyCard } from '@/components/AdminNotifyCard';
import { api } from '@/lib/api';
import { cn, formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { getStoredUser, type AuthUser } from '@/lib/auth';
import {
  MemberStats,
  MemberBirthday,
  MemberGrowthPoint,
  STATUS_LABELS,
  STATUS_VARIANTS,
} from '@/lib/members';
import { PaginatedEvents, Event } from '@/lib/events';
import { FinancialStats } from '@/lib/financial';
import { Campaign } from '@/lib/campaigns';
import { verseOfDay } from '@/lib/verse-of-day';

interface WorshipItem {
  id: string;
  title: string;
  date: string;
}

/** "domingo às 18h" / "hoje às 19h30" — contexto humano sob a saudação. */
function quandoCulto(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':00', 'h')
    .replace(':', 'h');
  if (mesmoDia) return `hoje às ${hora}`;
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${dia} às ${hora}`;
}

const EMPTY_STATS: MemberStats = {
  total: 0,
  active: 0,
  visitors: 0,
  inactive: 0,
  recent: [],
};

const FINANCE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR', 'TREASURER'];

function Skeleton({ className }: { className?: string }): React.ReactElement {
  return <div className={cn('animate-pulse rounded bg-slate-200 dark:bg-slate-700', className)} />;
}

export default function DashboardPage(): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<MemberStats>(EMPTY_STATS);
  const [events, setEvents] = useState<Event[]>([]);
  const [finance, setFinance] = useState<FinancialStats | null>(null);
  const [birthdays, setBirthdays] = useState<MemberBirthday[]>([]);
  const [growth, setGrowth] = useState<MemberGrowthPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [nextWorship, setNextWorship] = useState<WorshipItem | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const current = getStoredUser();
    if (mounted) setUser(current);
    const canFinance = !!current && FINANCE_ROLES.includes(current.role);

    const tasks: Promise<unknown>[] = [
      api
        .get<MemberStats>('/members/stats')
        .then(({ data }) => {
          if (mounted) setStats(data);
        })
        .catch(() => {
          if (mounted) setError(true);
        }),
      api
        .get<PaginatedEvents>('/events', {
          params: { when: 'upcoming', limit: 5 },
        })
        .then(({ data }) => {
          if (mounted) setEvents(data.data);
        })
        .catch(() => undefined),
      api
        .get<MemberBirthday[]>('/members/birthdays')
        .then(({ data }) => {
          if (mounted) setBirthdays(data);
        })
        .catch(() => undefined),
      api
        .get<MemberGrowthPoint[]>('/members/growth')
        .then(({ data }) => {
          if (mounted) setGrowth(data);
        })
        .catch(() => undefined),
      api
        .get<Campaign[]>('/campaigns', { params: { status: 'ACTIVE' } })
        .then(({ data }) => {
          if (mounted) setCampaigns(data);
        })
        .catch(() => undefined),
      api
        .get<WorshipItem[]>('/worship', { params: { when: 'upcoming' } })
        .then(({ data }) => {
          if (mounted) setNextWorship(data[0] ?? null);
        })
        .catch(() => undefined),
    ];

    if (canFinance) {
      tasks.push(
        api
          .get<FinancialStats>('/financial/stats')
          .then(({ data }) => {
            if (mounted) setFinance(data);
          })
          .catch(() => undefined),
      );
    }

    Promise.allSettled(tasks).finally(() => {
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const verse = verseOfDay();
  const firstName = user?.name?.split(' ')[0] ?? '';
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const newThisMonth = growth.length ? growth[growth.length - 1].count : 0;
  const maxGrowth = Math.max(1, ...growth.map((g) => g.count));

  const cards: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    trend?: number;
  }[] = [
    {
      label: 'Total de membros',
      value: stats.total,
      icon: Users,
      href: '/members',
      trend: newThisMonth,
    },
    {
      label: 'Membros ativos',
      value: stats.active,
      icon: UserCheck,
      href: '/members?status=ACTIVE',
    },
    {
      label: 'Visitantes',
      value: stats.visitors,
      icon: UserPlus,
      href: '/members?status=VISITOR',
    },
    {
      label: 'Inativos',
      value: stats.inactive,
      icon: UserMinus,
      href: '/members?status=INACTIVE',
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {firstName ? `Olá, ${firstName} 👋` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="capitalize">{today}</span>
          {ready && nextWorship && (
            <>
              {' · '}
              <Link
                href={`/worship/${nextWorship.id}`}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {nextWorship.title} {quandoCulto(nextWorship.date)}
              </Link>
            </>
          )}
        </p>
      </div>

      <PortalPendingAlert />
      <AdminNotifyCard />

      {/* Ações rápidas: o que mais se faz no dia a dia, a um clique. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { href: '/members/new', label: 'Novo membro', icon: UserPlus },
          {
            href: '/communications/new',
            label: 'Publicar aviso',
            icon: Megaphone,
          },
          { href: '/events/new', label: 'Novo evento', icon: Calendar },
          { href: '/worship/new', label: 'Planejar culto', icon: BookOpen },
          { href: '/financial/new', label: 'Lançamento', icon: Wallet },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-150 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <Icon className="h-3.5 w-3.5" />
              {a.label}
            </Link>
          );
        })}
      </div>

      {/* Palavra do dia */}
      <div className="mb-6 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/40 to-white dark:to-slate-900 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Palavra do dia
            </p>
            <p className="mt-1 italic leading-relaxed text-slate-700 dark:text-slate-300">
              “{verse.text}”
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {verse.ref}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Não foi possível carregar alguns dados. Verifique sua conexão e
          atualize a página.
        </div>
      )}

      {/* Cards de membros (clicáveis) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
                    {ready ? (
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {c.value}
                      </p>
                    ) : (
                      <Skeleton className="mt-2 h-7 w-12" />
                    )}
                    {ready && c.trend !== undefined && c.trend > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        +{c.trend} este mês
                      </p>
                    )}
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Resumo financeiro do mês (somente papéis autorizados) */}
      {user && FINANCE_ROLES.includes(user.role) && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Entradas do mês</p>
                {ready ? (
                  <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(finance?.monthIncome ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saídas do mês</p>
                {ready ? (
                  <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(finance?.monthExpense ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo do mês</p>
                {ready ? (
                  <p
                    className={cn(
                      'mt-1 text-xl font-bold',
                      (finance?.monthBalance ?? 0) >= 0
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatCurrency(finance?.monthBalance ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo geral</p>
                {ready ? (
                  <p
                    className={cn(
                      'mt-1 text-xl font-bold',
                      (finance?.balance ?? 0) >= 0
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatCurrency(finance?.balance ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Landmark className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Crescimento + Aniversariantes */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Novos membros (últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="flex h-40 items-end gap-3">
                {growth.map((g) => (
                  <div
                    key={g.key}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {g.count}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-indigo-500"
                        style={{
                          height: `${(g.count / maxGrowth) * 100}%`,
                          minHeight: g.count > 0 ? '4px' : '0',
                        }}
                      />
                    </div>
                    <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                      {g.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cake className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Aniversariantes do mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            ) : birthdays.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                Nenhum aniversariante neste mês.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {birthdays.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <Link
                      href={`/members/${b.id}`}
                      className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {b.name}
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(b.birthDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membros recentes + Próximos eventos */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membros recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : stats.recent.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Nenhum membro cadastrado ainda.
                </p>
                <Link
                  href="/members/new"
                  className="mt-3 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Cadastrar primeiro membro
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recent.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <Link
                        href={`/members/${m.id}`}
                        className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {m.joinedAt
                          ? `Entrada em ${formatDate(m.joinedAt)}`
                          : `Cadastrado em ${formatDate(m.createdAt)}`}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[m.status]}>
                      {STATUS_LABELS[m.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Próximos eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : events.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Nenhum evento agendado.
                </p>
                <Link
                  href="/events/new"
                  className="mt-3 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Criar evento
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <Link
                        href={`/events/${e.id}`}
                        className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {e.name}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(e.date)}
                        {e.location ? ` · ${e.location}` : ''}
                      </p>
                    </div>
                    {e.type && <Badge variant="default">{e.type}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campanhas ativas */}
      {ready && campaigns.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Campanhas em andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.map((c) => {
                const goal = Number(c.goal ?? 0);
                const current = Number(c.current ?? 0);
                const pct =
                  goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm">
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {c.title}
                      </Link>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatCurrency(current)}
                        {goal > 0 ? ` / ${formatCurrency(goal)}` : ''}
                      </span>
                    </div>
                    {goal > 0 && (
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
