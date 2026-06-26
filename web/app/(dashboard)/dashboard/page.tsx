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
  Megaphone,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const EMPTY_STATS: MemberStats = {
  total: 0,
  active: 0,
  visitors: 0,
  inactive: 0,
  recent: [],
};

const FINANCE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR', 'TREASURER'];

function Skeleton({ className }: { className?: string }): React.ReactElement {
  return <div className={cn('animate-pulse rounded bg-slate-200', className)} />;
}

export default function DashboardPage(): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<MemberStats>(EMPTY_STATS);
  const [events, setEvents] = useState<Event[]>([]);
  const [finance, setFinance] = useState<FinancialStats | null>(null);
  const [birthdays, setBirthdays] = useState<MemberBirthday[]>([]);
  const [growth, setGrowth] = useState<MemberGrowthPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {firstName ? `Olá, ${firstName} 👋` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm capitalize text-slate-500">{today}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
                    <p className="text-sm text-slate-500">{c.label}</p>
                    {ready ? (
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {c.value}
                      </p>
                    ) : (
                      <Skeleton className="mt-2 h-7 w-12" />
                    )}
                    {ready && c.trend !== undefined && c.trend > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        +{c.trend} este mês
                      </p>
                    )}
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">Entradas do mês</p>
                {ready ? (
                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {formatCurrency(finance?.monthIncome ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">Saídas do mês</p>
                {ready ? (
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatCurrency(finance?.monthExpense ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-500">Saldo do mês</p>
                {ready ? (
                  <p
                    className={cn(
                      'mt-1 text-xl font-bold',
                      (finance?.monthBalance ?? 0) >= 0
                        ? 'text-slate-900'
                        : 'text-red-600',
                    )}
                  >
                    {formatCurrency(finance?.monthBalance ?? 0)}
                  </p>
                ) : (
                  <Skeleton className="mt-2 h-6 w-24" />
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Wallet className="h-5 w-5" />
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
              <TrendingUp className="h-4 w-4 text-indigo-600" />
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
                    <span className="text-xs font-medium text-slate-700">
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
                    <span className="text-xs capitalize text-slate-500">
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
              <Cake className="h-4 w-4 text-indigo-600" />
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
              <p className="py-8 text-center text-sm text-slate-400">
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
                      className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {b.name}
                    </Link>
                    <span className="text-xs text-slate-500">
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
                <p className="text-sm text-slate-400">
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
                        className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-slate-500">
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
              <Calendar className="h-4 w-4 text-indigo-600" />
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
                <p className="text-sm text-slate-400">
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
                        className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {e.name}
                      </Link>
                      <p className="text-xs text-slate-500">
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
                <Megaphone className="h-4 w-4 text-indigo-600" />
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
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {c.title}
                      </Link>
                      <span className="text-slate-500">
                        {formatCurrency(current)}
                        {goal > 0 ? ` / ${formatCurrency(goal)}` : ''}
                      </span>
                    </div>
                    {goal > 0 && (
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
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
