'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { WorshipForm } from '@/components/worship/WorshipForm';
import { api, extractApiError } from '@/lib/api';
import { WorshipService } from '@/lib/worship';

export default function EditWorshipPage(): React.ReactElement {
  const params = useParams();
  const id = String(params.id);

  const [service, setService] = useState<WorshipService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <Link href={`/worship/${id}`}>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader title="Editar culto" description="Atualize o planejamento." />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : error || !service ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Culto não encontrado.'}
        </div>
      ) : (
        <WorshipForm service={service} />
      )}
    </div>
  );
}
