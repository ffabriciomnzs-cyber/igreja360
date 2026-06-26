'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Printer,
  CalendarDays,
  BookOpen,
  ListOrdered,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function WorshipDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [service, setService] = useState<WorshipService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setCanManage(!!user && MANAGE_ROLES.includes(user.role));
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get<WorshipService>(`/worship/${id}`)
      .then(({ data }) => {
        if (mounted) setService(data);
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
  }, [id]);

  async function handleDelete(): Promise<void> {
    if (!confirm('Excluir este culto? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);
    try {
      await api.delete(`/worship/${id}`);
      router.push('/worship');
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (error || !service) {
    return (
      <div>
        <Link href="/worship">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Culto não encontrado.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <Link href="/worship">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {service.title}
            </h1>
            <Badge variant={WORSHIP_STATUS_VARIANTS[service.status]}>
              {WORSHIP_STATUS_LABELS[service.status]}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            {formatDateTime(service.date)}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {canManage && (
            <>
              <Link href={`/worship/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>

      {(service.theme || service.bibleRef || service.notes) && (
        <Card className="mb-4">
          <CardContent className="space-y-2 p-5">
            {service.theme && (
              <p className="text-slate-800">
                <span className="font-medium text-slate-500">Tema: </span>
                {service.theme}
              </p>
            )}
            {service.bibleRef && (
              <p className="flex items-center gap-1.5 text-slate-800">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-slate-500">Texto-base: </span>
                {service.bibleRef}
              </p>
            )}
            {service.notes && (
              <p className="whitespace-pre-line text-sm text-slate-600">
                {service.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListOrdered className="h-4 w-4 text-indigo-600" />
              Ordem do culto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {service.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Nenhum item definido.
              </p>
            ) : (
              <ol className="space-y-3">
                {service.items.map((item, i) => (
                  <li key={item.id ?? i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-800">
                          {item.title}
                        </p>
                        {item.durationMin != null && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {item.durationMin} min
                          </span>
                        )}
                      </div>
                      {item.responsible && (
                        <p className="text-sm text-slate-500">
                          {item.responsible}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-slate-400">{item.notes}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-indigo-600" />
              Participantes / escala
            </CardTitle>
          </CardHeader>
          <CardContent>
            {service.participants.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Ninguém escalado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {service.participants.map((p, i) => (
                  <li
                    key={p.id ?? i}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{p.name}</p>
                      {p.notes && (
                        <p className="text-xs text-slate-400">{p.notes}</p>
                      )}
                    </div>
                    <Badge variant="default">{p.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
