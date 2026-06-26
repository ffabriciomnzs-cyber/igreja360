'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Network,
  CalendarDays,
  Megaphone,
  HandHeart,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { ReportShell } from '@/components/reports/ReportShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ReportOverview } from '@/lib/reports';

function Stat({
  label,
  value,
  icon: Icon,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof Users;
  color?: string;
  bg?: string;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${bg} ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewReportPage(): React.ReactElement {
  const [data, setData] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ReportOverview>('/reports/overview')
      .then(({ data: res }) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(extractApiError(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ReportShell
      title="Visão geral"
      description="Panorama consolidado da igreja."
      loading={loading}
      error={error}
    >
      {data && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pessoas
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Total de membros"
              value={data.members.total}
              icon={Users}
            />
            <Stat
              label="Membros ativos"
              value={data.members.active}
              icon={Users}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <Stat
              label="Visitantes"
              value={data.members.visitors}
              icon={Users}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <Stat
              label="Em células"
              value={data.cells.membersInCells}
              icon={Network}
            />
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Financeiro
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              label="Receitas (total)"
              value={formatCurrency(data.financial.income)}
              icon={TrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <Stat
              label="Despesas (total)"
              value={formatCurrency(data.financial.expense)}
              icon={TrendingDown}
              color="text-red-600"
              bg="bg-red-50"
            />
            <Stat
              label="Saldo"
              value={formatCurrency(data.financial.balance)}
              icon={Wallet}
              color={
                data.financial.balance >= 0 ? 'text-indigo-600' : 'text-red-600'
              }
            />
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Atividades
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Células ativas"
              value={data.cells.active}
              icon={Network}
            />
            <Stat
              label="Próximos eventos"
              value={data.events.upcoming}
              icon={CalendarDays}
            />
            <Stat
              label="Campanhas ativas"
              value={data.campaigns.active}
              icon={Megaphone}
            />
            <Stat
              label="Pedidos em oração"
              value={data.prayers.active}
              icon={HandHeart}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categories.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Nenhum lançamento registrado.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.categories.map((c, i) => (
                    <li
                      key={`${c.category}-${c.type}-${i}`}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={c.type === 'INCOME' ? 'success' : 'danger'}
                        >
                          {c.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <span className="text-slate-700">{c.category}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          c.type === 'INCOME'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(c.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </ReportShell>
  );
}
