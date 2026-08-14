/*
 * Página PÚBLICA de divulgação do evento — é este link que circula no WhatsApp.
 *
 * Por que existe: o WhatsApp (e Instagram, Facebook, Telegram) só mostra a
 * imagem quando o que se compartilha é um LINK cuja página tem as marcações
 * Open Graph. Compartilhar texto puro nunca leva o cartaz junto.
 *
 * É Server Component de propósito: as marcações precisam existir no HTML que
 * o robô do WhatsApp busca — ele não roda JavaScript.
 *
 * Só o que já está no cartaz: nome, data, local e descrição. Nada de membro,
 * inscrito ou dado interno da igreja.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, Clock, ArrowRight } from 'lucide-react';

interface EventoPublico {
  id: string;
  name: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  type: string | null;
  photoUrl: string | null;
  church: { name: string; slug: string } | null;
}

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:3000/v1';

/** Base absoluta do próprio site (o robô do WhatsApp exige URL absoluta). */
function siteUrl(): string {
  const bruto =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  return bruto.replace(/\/$/, '');
}

async function buscaEvento(id: string): Promise<EventoPublico | null> {
  try {
    const res = await fetch(`${API}/public/events/${id}`, {
      // Cartaz e horário mudam pouco; 5 min evita martelar a API a cada
      // pessoa que abre o link no grupo.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventoPublico;
  } catch {
    return null;
  }
}

function dataLonga(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const evento = await buscaEvento(id);
  if (!evento) return { title: 'Evento não encontrado' };

  const quando = `${dataLonga(evento.date)} às ${hora(evento.date)}`;
  const descricao = [
    quando,
    evento.location ? `Local: ${evento.location}` : '',
    evento.description ?? '',
  ]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 300);

  const imagem = evento.photoUrl ? `${API}${evento.photoUrl}` : undefined;

  return {
    title: `${evento.name} — ${evento.church?.name ?? 'Igreja360'}`,
    description: descricao,
    openGraph: {
      title: evento.name,
      description: descricao,
      type: 'website',
      locale: 'pt_BR',
      siteName: evento.church?.name ?? 'Igreja360',
      url: siteUrl() ? `${siteUrl()}/e/${evento.id}` : undefined,
      images: imagem ? [{ url: imagem, alt: evento.name }] : undefined,
    },
    twitter: {
      card: imagem ? 'summary_large_image' : 'summary',
      title: evento.name,
      description: descricao,
      images: imagem ? [imagem] : undefined,
    },
  };
}

export default async function EventoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const evento = await buscaEvento(id);
  if (!evento) notFound();

  const cartaz = evento.photoUrl ? `${API}${evento.photoUrl}` : null;
  const portal = evento.church?.slug
    ? `/portal/${evento.church.slug}/eventos/${evento.id}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-slate-900">
          {cartaz && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cartaz}
              alt={evento.name}
              className="w-full bg-slate-100 object-contain dark:bg-slate-800"
            />
          )}

          <div className="p-5">
            {evento.church?.name && (
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {evento.church.name}
              </p>
            )}
            <h1 className="mt-1 text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
              {evento.name}
            </h1>

            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <span className="first-letter:uppercase">{dataLonga(evento.date)}</span>
              </p>
              <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                {hora(evento.date)}
                {evento.endDate ? ` às ${hora(evento.endDate)}` : ''}
              </p>
              {evento.location && (
                <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  {evento.location}
                </p>
              )}
            </div>

            {evento.description && (
              <p className="mt-4 whitespace-pre-line border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                {evento.description}
              </p>
            )}

            {portal && (
              <a
                href={portal}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Ver no app da igreja
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          {evento.church?.name ?? 'Igreja360'}
        </p>
      </div>
    </div>
  );
}
