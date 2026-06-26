'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  ListOrdered,
  Users,
  CalendarDays,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import {
  WorshipService,
  WORSHIP_STATUS_LABELS,
  WORSHIP_STATUS_VARIANTS,
} from '@/lib/worship';

const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR', 'SECRETARY'];

export default function WorshipListPage(): React.ReactElement {
  const [services, setServices] = useState<WorshipService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setCanManage(!!user && MANAGE_ROLES.includes(user.role));
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<WorshipService[]>('/worship', { params: { when } })
      .then(({ data }) => {
        if (mounted) setServices(data);
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
  }, [when]);

  return (
    <div>
      <PageHeader
        title="Cultos"
        description="Planeje os cultos e escale os participantes."
        action={
          canManage ? (
            <Link href="/worship/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo culto
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        {(['upcoming', 'past'] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWhen(w)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              when === w
                ? 'bg-indigo-600 text-white'
                : 'border border-border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {w === 'upcoming' ? 'Próximos' : 'Anteriores'}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-400">
              {when === 'upcoming'
                ? 'Nenhum culto planejado.'
                : 'Nenhum culto anterior.'}
            </p>
            {canManage && when === 'upcoming' && (
              <Link href="/worship/new">
                <Button size="sm" className="mt-3">
                  <Plus className="h-4 w-4" />
                  Planejar culto
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((s) => (
            <Link key={s.id} href={`/worship/${s.id}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">
                      {s.title}
                    </h3>
                    <Badge variant={WORSHIP_STATUS_VARIANTS[s.status]}>
                      {WORSHIP_STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateTime(s.date)}
                  </p>
                  {s.theme && (
                    <p className="mt-2 text-sm text-slate-700">{s.theme}</p>
                  )}
                  {s.bibleRef && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      {s.bibleRef}
                    </p>
                  )}
                  <div className="mt-3 flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5" />
                      {s._count?.items ?? 0} itens
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {s._count?.participants ?? 0} participantes
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
