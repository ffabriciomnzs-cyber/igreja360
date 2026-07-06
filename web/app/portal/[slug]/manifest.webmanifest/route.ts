import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Manifesto PWA por igreja (slug), para o portal ser instalável como app.
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
): Promise<Response> {
  const slug = params.slug;

  // Tenta usar o nome da igreja; se falhar, usa um nome genérico.
  let name = 'Portal do Membro';
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      const r = await fetch(`${api}/member-auth/church/${slug}`, {
        cache: 'no-store',
      });
      if (r.ok) {
        const d = (await r.json()) as { name?: string };
        if (d?.name) name = d.name;
      }
    }
  } catch {
    /* usa o nome padrão */
  }

  const manifest = {
    id: `/portal/${slug}`,
    name,
    short_name: name.length > 12 ? 'Portal' : name,
    description:
      'Devocional diário, cultos, eventos, campanhas e Bíblia da sua igreja.',
    lang: 'pt-BR',
    start_url: `/portal/${slug}/inicio`,
    scope: `/portal/${slug}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
