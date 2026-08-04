'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, X, UserCheck, KeyRound, Copy } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/skeleton';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface PendingMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

interface ResetRequest {
  id: string;
  createdAt: string;
  member: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export default function PortalRequestsPage(): React.ReactElement {
  const [rows, setRows] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const [resets, setResets] = useState<ResetRequest[]>([]);
  const [resetting, setResetting] = useState<string | null>(null);
  // Senhas temporárias geradas nesta visita, por pedido (mostradas uma vez).
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<PendingMember[]>('/members/portal/pending'),
      api.get<ResetRequest[]>('/members/portal/reset-requests'),
    ])
      .then(([pend, res]) => {
        setRows(pend.data);
        setResets(res.data);
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'approve' | 'reject'): Promise<void> {
    setActing(id);
    try {
      await api.post(`/members/${id}/portal/${action}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      window.dispatchEvent(new Event('igreja360:portal-requests-updated'));
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setActing(null);
    }
  }

  async function generateTemp(reqRow: ResetRequest): Promise<void> {
    setResetting(reqRow.id);
    setError(null);
    try {
      const { data } = await api.post<{ tempPassword: string }>(
        `/members/${reqRow.member.id}/portal/reset-password`,
      );
      setTempPasswords((prev) => ({ ...prev, [reqRow.id]: data.tempPassword }));
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setResetting(null);
    }
  }

  async function copyTemp(id: string): Promise<void> {
    const pwd = tempPasswords[id];
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedId(id);
    } catch {
      /* ignora */
    }
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
        title="Solicitações de acesso"
        description="Membros que se cadastraram no portal e aguardam liberação."
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              Nenhuma solicitação pendente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{r.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {r.email ?? 'sem e-mail'}
                    {r.phone ? ` · ${r.phone}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Solicitado em {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => act(r.id, 'approve')}
                    disabled={acting === r.id}
                  >
                    {acting === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act(r.id, 'reject')}
                    disabled={acting === r.id}
                  >
                    <X className="h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pedidos de "esqueci minha senha" feitos na tela de entrada do portal */}
      {!loading && resets.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Redefinições de senha pedidas pelos membros
          </h2>
          <div className="space-y-3">
            {resets.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {r.member.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {r.member.email ?? 'sem e-mail'}
                      {r.member.phone ? ` · ${r.member.phone}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Pedido em {formatDate(r.createdAt)}
                    </p>
                  </div>
                  {tempPasswords[r.id] ? (
                    <div className="space-y-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3">
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Senha temporária (anote e repasse ao membro):
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-white dark:bg-slate-900 px-2 py-1 font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-slate-100">
                          {tempPasswords[r.id]}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTemp(r.id)}
                        >
                          {copiedId === r.id ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => generateTemp(r)}
                      disabled={resetting === r.id}
                    >
                      {resetting === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Gerar senha temporária
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
