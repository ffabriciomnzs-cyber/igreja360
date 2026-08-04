'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Pencil, IdCard, KeyRound, Copy, Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Member,
  roleLabel,
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
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

export default function MemberDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function resetPortalPassword(): Promise<void> {
    if (
      !window.confirm(
        'Gerar uma senha temporária? A senha atual do membro deixa de funcionar na hora.',
      )
    ) {
      return;
    }
    setResetting(true);
    setResetError(null);
    try {
      const { data } = await api.post<{ tempPassword: string }>(
        `/members/${params.id}/portal/reset-password`,
      );
      setTempPassword(data.tempPassword);
      setCopied(false);
    } catch (err) {
      setResetError(extractApiError(err));
    } finally {
      setResetting(false);
    }
  }

  async function copyTempPassword(): Promise<void> {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      /* ignora */
    }
  }

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
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
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
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
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
          <div className="flex items-center gap-2">
            <Link href={`/members/${member.id}/card`}>
              <Button variant="outline">
                <IdCard className="h-4 w-4" />
                Carteirinha
              </Button>
            </Link>
            <Link href={`/members/${member.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
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
            <Field
              label="Batismo"
              value={member.baptismDate ? formatDate(member.baptismDate) : null}
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
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
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
              value={member.role ? roleLabel(member.role, member.gender) : null}
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

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Portal do membro
              </p>
              {tempPassword ? (
                <div className="mt-2 space-y-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Senha temporária (mostrada só agora — anote e repasse ao
                    membro):
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white dark:bg-slate-900 px-2 py-1.5 font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-slate-100">
                      {tempPassword}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyTempPassword}>
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Oriente o membro a trocar a senha no Perfil após entrar.
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={resetPortalPassword}
                  disabled={resetting}
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Redefinir senha do portal
                </Button>
              )}
              {resetError && (
                <p className="mt-2 rounded-md bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {resetError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
