'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, Network, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Metrics {
  totalMembers: number;
  activeMembers: number;
  activeCells: number;
  monthBalance: number;
}

const EMPTY: Metrics = {
  totalMembers: 0,
  activeMembers: 0,
  activeCells: 0,
  monthBalance: 0,
};

export default function DashboardPage(): React.ReactElement {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get<Metrics>('/dashboard/metrics')
      .then(({ data }) => {
        if (mounted) setMetrics(data);
      })
      .catch(() => {
        /* endpoint da Fase 2 — mantém zero state */
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { label: 'Total de membros', value: metrics.totalMembers, icon: Users },
    { label: 'Membros ativos', value: metrics.activeMembers, icon: UserCheck },
    { label: 'Células ativas', value: metrics.activeCells, icon: Network },
    {
      label: 'Saldo do mês',
      value: formatCurrency(metrics.monthBalance),
      icon: Wallet,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua igreja."
      />

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
            <CardTitle>Crescimento de membros</CardTitle>
          </CardHeader>
          <CardContent className="flex h-48 items-center justify-center text-sm text-slate-400">
            Gráfico disponível após a implementação do módulo Membros (Fase 2).
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent className="flex h-48 items-center justify-center text-sm text-slate-400">
            Nenhum evento carregado.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
