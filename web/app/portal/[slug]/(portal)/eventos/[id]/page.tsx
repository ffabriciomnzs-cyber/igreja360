'use client';

// Detalhe do evento no portal do membro: cartaz, data, local e a descrição
// que a igreja escreveu (dia, pregação, tema).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { eventPhotoSrc } from '@/lib/events';

interface EventoPortal {
  id: string;
  name: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  type: string | null;
  photoUrl: string | null;
}

function dataLonga(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function EventoPage(): React.ReactElement {
  const params = useParams();
  const slug = String(params?.slug ?? '');
  const id = String(params?.id ?? '');
  const base = `/portal/${slug}`;

  const [evento, setEvento] = useState<EventoPortal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    memberApi
      .get<EventoPortal>(`/member-auth/events/${id}`)
      .then(({ data }) => {
        if (ativo) setEvento(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  async function compartilhar(): Promise<void> {
    if (!evento) return;
    const texto = [
      evento.name,
      `${dataLonga(evento.date)} às ${hora(evento.date)}`,
      evento.location ? `Local: ${evento.location}` : '',
      evento.description ?? '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: evento.name, text: texto });
      } else {
        await navigator.clipboard.writeText(texto);
      }
    } catch {
      /* usuário cancelou */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="space-y-4">
        <Link
          href={`${base}/inicio`}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <p className="rounded-2xl border border-border bg-white p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          Não encontramos esse evento. Ele pode ter sido removido pela igreja.
        </p>
      </div>
    );
  }

  const cartaz = eventPhotoSrc(evento);

  return (
    <div className="space-y-4">
      <Link
        href={`${base}/inicio`}
        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        {cartaz && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cartaz}
            alt={evento.name}
            className="w-full bg-slate-100 object-contain dark:bg-slate-800"
          />
        )}

        <div className="p-4">
          <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
            {evento.name}
          </h1>

          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <dd className="capitalize text-slate-700 dark:text-slate-300">
                {dataLonga(evento.date)}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <dd className="text-slate-700 dark:text-slate-300">
                {hora(evento.date)}
                {evento.endDate ? ` às ${hora(evento.endDate)}` : ''}
              </dd>
            </div>
            {evento.location && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <dd className="text-slate-700 dark:text-slate-300">
                  {evento.location}
                </dd>
              </div>
            )}
            {evento.capacity ? (
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <dd className="text-slate-700 dark:text-slate-300">
                  {evento.capacity} lugares
                </dd>
              </div>
            ) : null}
          </dl>

          {evento.description && (
            <p className="mt-4 whitespace-pre-line border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
              {evento.description}
            </p>
          )}

          <button
            onClick={compartilhar}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Share2 className="h-4 w-4" />
            Convidar alguém
          </button>
        </div>
      </div>
    </div>
  );
}
