'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Event, PaginatedEvents } from '@/lib/events';

export default function EventsPage(): React.ReactElement {
  const [events, setEvents] = useState<Event[]>([]);
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedEvents>('/events', {
        params: { when, search: search.trim() || undefined, limit: 50 },
      });
      setEvents(data.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [when, search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleDelete(ev: Event): Promise<void> {
    if (!window.confirm(`Remover o evento ${ev.name}?`)) return;
    setDeletingId(ev.id);
    try {
      await api.delete(`/events/${ev.id}`);
      await load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Eventos"
        description="Agenda e organização dos eventos da igreja."
        action={
          <Link href="/events/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo evento
            </Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-md border border-input p-0.5">
            <button
              onClick={() => setWhen('upcoming')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                when === 'upcoming'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setWhen('past')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                when === 'past'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Passados
            </button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou local"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando eventos...
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CalendarDays className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              {when === 'upcoming'
                ? 'Nenhum evento agendado'
                : 'Nenhum evento passado'}
            </p>
            <p className="text-sm text-slate-500">
              Crie um novo evento para a agenda da igreja.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <Card key={ev.id} className="flex flex-col overflow-hidden">
              <Link href={`/events/${ev.id}`}>
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700">
                  {ev.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.photo}
                      alt={ev.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CalendarDays className="h-10 w-10 text-white/70" />
                  )}
                </div>
              </Link>
              <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/events/${ev.id}`}
                    className="font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {ev.name}
                  </Link>
                  {ev.type && <Badge variant="default">{ev.type}</Badge>}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {formatDateTime(ev.date)}
                </div>
                {ev.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {ev.location}
                  </div>
                )}
                {ev.capacity != null && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    {ev.capacity} lugares
                  </div>
                )}
                <div className="mt-auto flex items-center justify-end gap-1 pt-2">
                  <Link href={`/events/${ev.id}/edit`}>
                    <Button variant="ghost" size="icon" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remover"
                    onClick={() => handleDelete(ev)}
                    disabled={deletingId === ev.id}
                  >
                    {deletingId === ev.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
