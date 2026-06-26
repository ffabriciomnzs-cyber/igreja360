'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Cake,
  UserPlus,
  Network,
  UserMinus,
  MapPin,
  Wallet,
  LineChart,
  CalendarDays,
  Megaphone,
  HandHeart,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

interface ReportItem {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
}

interface ReportGroup {
  label: string;
  items: ReportItem[];
}

const groups: ReportGroup[] = [
  {
    label: 'Geral',
    items: [
      {
        href: '/reports/overview',
        title: 'Visão geral',
        description: 'Panorama consolidado da igreja em um só lugar.',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      {
        href: '/reports/members',
        title: 'Lista de membros',
        description: 'Membros com filtros por status, célula e cargo.',
        icon: Users,
      },
      {
        href: '/reports/birthdays',
        title: 'Aniversariantes',
        description: 'Aniversários de nascimento e de batismo por mês.',
        icon: Cake,
      },
      {
        href: '/reports/new-members',
        title: 'Novos membros',
        description: 'Entradas por período e crescimento mês a mês.',
        icon: UserPlus,
      },
      {
        href: '/reports/members-by-cell',
        title: 'Membros por célula',
        description: 'Distribuição por célula e quem está sem célula.',
        icon: Network,
      },
      {
        href: '/reports/inactive',
        title: 'Membros inativos',
        description: 'Lista para acompanhamento e reativação.',
        icon: UserMinus,
      },
      {
        href: '/reports/members-by-city',
        title: 'Membros por cidade',
        description: 'Distribuição geográfica para visitas e logística.',
        icon: MapPin,
      },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      {
        href: '/reports/financial',
        title: 'Demonstrativo financeiro',
        description: 'Receitas, despesas e saldo por período e categoria.',
        icon: Wallet,
      },
      {
        href: '/reports/cashflow',
        title: 'Fluxo de caixa',
        description: 'Evolução de entradas e saídas mês a mês.',
        icon: LineChart,
      },
    ],
  },
  {
    label: 'Atividades',
    items: [
      {
        href: '/reports/cells',
        title: 'Relatório de células',
        description: 'Células ativas, membros e reuniões realizadas.',
        icon: Network,
      },
      {
        href: '/reports/events',
        title: 'Eventos',
        description: 'Eventos agendados e realizados por período.',
        icon: CalendarDays,
      },
      {
        href: '/reports/campaigns',
        title: 'Campanhas',
        description: 'Progresso das campanhas: meta x arrecadado.',
        icon: Megaphone,
      },
      {
        href: '/reports/prayers',
        title: 'Pedidos de oração',
        description: 'Pedidos ativos e respondidos por período.',
        icon: HandHeart,
      },
    ],
  },
];

export default function ReportsCatalogPage(): React.ReactElement {
  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Escolha um relatório para visualizar, imprimir ou exportar."
      />

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group">
                    <Card className="h-full transition-shadow group-hover:shadow-md">
                      <CardContent className="flex h-full items-start gap-4 p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-600" />
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
