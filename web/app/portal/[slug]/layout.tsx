import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:3000/v1';

/**
 * Base absoluta do próprio site (o robô do WhatsApp exige URL absoluta).
 *
 * Sai do cabeçalho da requisição em vez de uma variável de ambiente: assim
 * funciona sem ninguém precisar configurar nada e acompanha o domínio de
 * verdade quando ele mudar. A variável fica como reserva.
 */
async function siteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? 'https';
      return `${proto}://${host}`;
    }
  } catch {
    /* fora de uma requisição: cai na variável */
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
}

/** Nome e logo da igreja, para o convite não chegar como um link sem cara. */
async function buscaIgreja(
  slug: string,
): Promise<{ name: string; logo: string | null } | null> {
  try {
    const res = await fetch(`${API}/member-auth/church/${slug}`, {
      // O nome da igreja quase nunca muda; 1h evita martelar a API a cada
      // pessoa que abre o convite no grupo.
      next: { revalidate: 3600 },
      // Sem prazo, uma API lenta seguraria a tela de entrada do portal. O
      // cartão do link é um enfeite: não pode atrasar quem quer só entrar.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { name: string; logo: string | null };
  } catch {
    return null;
  }
}

// Metadados do portal por igreja: liga o manifesto PWA, ícones e modo "app" no
// iOS — e o cartão de pré-visualização do link, que é o que aparece quando
// alguém convida outra pessoa colando o endereço numa conversa.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const igreja = await buscaIgreja(slug);
  const site = await siteUrl();
  const titulo = igreja ? `Portal da ${igreja.name}` : 'Portal da igreja';
  const descricao =
    'Cultos, eventos, devocional e a Arena Bíblica — tudo no seu celular. Entre e participe.';
  // A logo da igreja é a melhor capa possível. Sem ela (ou se estiver salva
  // como caminho relativo), cai no ícone do app — 512px, que é o mínimo que o
  // robô do WhatsApp aceita para montar o cartão.
  const imagem = igreja?.logo?.startsWith('http')
    ? igreja.logo
    : site
      ? `${site}/icons/icon-512.png`
      : undefined;

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      type: 'website',
      title: titulo,
      description: descricao,
      ...(site ? { url: `${site}/portal/${slug}` } : {}),
      ...(imagem ? { images: [imagem] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      ...(imagem ? { images: [imagem] } : {}),
    },
    manifest: `/portal/${slug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Portal',
    },
    icons: {
      icon: '/icons/icon-192.png',
      apple: '/icons/apple-touch-icon.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export default function PortalSlugLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
