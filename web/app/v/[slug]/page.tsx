/*
 * Página PÚBLICA de cadastro de visitante — é o que abre ao ler o QR code
 * no culto. Sem login, sem app instalado: a pessoa está em pé, no celular
 * dela, no meio da reunião.
 *
 * Por isso o formulário é curto e só o nome é obrigatório. Cada campo a mais
 * é uma chance de desistir no meio.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormularioVisitante } from './FormularioVisitante';

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:3000/v1';

interface Igreja {
  name: string;
  logo: string | null;
  cardLogo: string | null;
}

async function buscaIgreja(slug: string): Promise<Igreja | null> {
  try {
    const res = await fetch(`${API}/member-auth/church/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Igreja;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const igreja = await buscaIgreja(slug);
  return {
    title: igreja ? `Bem-vindo à ${igreja.name}` : 'Bem-vindo',
    description: 'Deixe seus dados para a igreja falar com você.',
    // Página de formulário pessoal: não deve aparecer em busca.
    robots: { index: false, follow: false },
  };
}

export default async function VisitantePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const igreja = await buscaIgreja(slug);
  if (!igreja) notFound();

  const logo = igreja.cardLogo || igreja.logo;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="text-center">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={igreja.name} className="mx-auto h-20 object-contain" />
          ) : null}
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Que bom ter você aqui!
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Deixe seu contato para a {igreja.name} falar com você.
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <FormularioVisitante slug={slug} igreja={igreja.name} />
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Seus dados ficam só com a liderança da igreja.
        </p>
      </div>
    </div>
  );
}
