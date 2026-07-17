'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  CalendarDays,
  MapPin,
  Users,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Event } from '@/lib/events';

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-slate-800">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function EventDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<Event>(`/events/${params.id}`)
      .then(({ data }) => {
        if (mounted) setEvent(data);
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
  }, [params.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </CardContent>
      </Card>
    );
  }

  if (error || !event) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => router.push('/events')}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Evento não encontrado.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/events">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <PageHeader
        title={event.name}
        description="Detalhes do evento."
        action={
          <Link href={`/events/${event.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        }
      />

      {event.photo && (
        <div className="mb-4 flex justify-center overflow-hidden rounded-lg bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.photo}
            alt={event.name}
            className="max-h-96 w-full object-contain"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Info
              icon={CalendarDays}
              label="Início"
              value={formatDateTime(event.date)}
            />
            {event.endDate && (
              <Info
                icon={Clock}
                label="Término"
                value={formatDateTime(event.endDate)}
              />
            )}
            <Info icon={MapPin} label="Local" value={event.location} />
            <Info
              icon={Users}
              label="Capacidade"
              value={event.capacity != null ? `${event.capacity} lugares` : null}
            />
            {event.type && (
              <div>
                <Badge variant="default">{event.type}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            {event.description ? (
              <p className="whitespace-pre-line text-sm text-slate-700">
                {event.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhuma descrição informada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
