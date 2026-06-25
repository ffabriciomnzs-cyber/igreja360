'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Member,
  ROLE_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
} from '@/lib/members';

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || '—'}</p>
    </div>
  );
}

export default function MemberDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<Member>(`/members/${params.id}`)
      .then(({ data }) => {
        if (mounted) setMember(data);
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

  if (error || !member) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => router.push('/members')}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Membro não encontrado.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/members">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <PageHeader
        title={member.name}
        description="Detalhes do membro."
        action={
          <Link href={`/members/${member.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Email" value={member.email} />
            <Field label="Telefone" value={member.phone} />
            <Field label="CPF" value={member.cpf} />
            <Field
              label="Nascimento"
              value={member.birthDate ? formatDate(member.birthDate) : null}
            />
            <Field label="Cidade" value={member.city} />
            <Field
              label="Endereço"
              value={member.address}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Status
              </p>
              <div className="mt-1">
                <Badge variant={STATUS_VARIANTS[member.status]}>
                  {STATUS_LABELS[member.status]}
                </Badge>
              </div>
            </div>
            <Field
              label="Cargo"
              value={member.role ? ROLE_LABELS[member.role] : null}
            />
            <Field label="Célula" value={member.cell?.name} />
            <Field
              label="Entrada"
              value={member.joinedAt ? formatDate(member.joinedAt) : null}
            />
            <Field
              label="Cadastrado em"
              value={formatDate(member.createdAt)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
