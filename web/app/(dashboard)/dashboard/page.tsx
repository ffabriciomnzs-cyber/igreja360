'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MemberStats, STATUS_LABELS, STATUS_VARIANTS } from '@/lib/members';

const EMPTY: MemberStats = {
  total: 0,
  active: 0,
  visitors: 0,
  inactive: 0,
  recent: [],
};

export default function DashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<MemberStats>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get<MemberStats>('/members/stats')
      .then(({ data }) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        /* mantém zero state em caso de erro */
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { label: 'Total de membros', value: stats.total, icon: Users },
    { label: 'Membros ativos', value: stats.active, icon: UserCheck },
    { label: 'Visitantes', value: stats.visitors, icon: UserPlus },
    { label: 'Inativos', value: stats.inactive, icon: UserMinus },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da sua igreja." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {ready ? c.value : '—'}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membros recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Carregando...
              </p>
            ) : stats.recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Nenhum membro cadastrado ainda.
              </p>
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
            <CardTitle>Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent className="flex h-48 items-center justify-center text-sm text-slate-400">
            Disponível após o módulo de Eventos (Fase 4).
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
