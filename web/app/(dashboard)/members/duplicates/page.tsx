'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ChevronLeft,
  Merge,
  CheckCircle2,
  Users,
  Phone,
  Mail,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Gender,
  MemberRole,
  MemberStatus,
  STATUS_LABELS,
  STATUS_VARIANTS,
  roleLabel,
} from '@/lib/members';

interface DupMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  status: MemberStatus;
  role: MemberRole | null;
  portalStatus: string;
  photo: string | null;
  city: string | null;
  createdAt: string;
  joinedAt: string | null;
  cell: { id: string; name: string } | null;
}

interface DupGroup {
  suggestedKeepId: string;
  members: DupMember[];
}

export default function DuplicatesPage(): React.ReactElement {
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [keepBy, setKeepBy] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);

  const load = useCallback((): void => {
    setLoading(true);
    api
      .get<DupGroup[]>('/members/duplicates')
      .then(({ data }) => {
        setGroups(data);
        setKeepBy(
          Object.fromEntries(data.map((g, i) => [i, g.suggestedKeepId])),
        );
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function mergeGroup(gi: number, group: DupGroup): Promise<void> {
    const keepId = keepBy[gi] ?? group.suggestedKeepId;
    const drops = group.members.filter((m) => m.id !== keepId);
    const keepName = group.members.find((m) => m.id === keepId)?.name ?? '';
    if (
      !confirm(
        `Mesclar ${group.members.length} cadastros em "${keepName}"? Os dados e a atividade serão unidos e os duplicados removidos. Não dá para desfazer.`,
      )
    ) {
      return;
    }
    setMerging(gi);
    setError(null);
    try {
      // mescla cada duplicado no cadastro escolhido
      for (const d of drops) {
        await api.post('/members/merge', { keepId, dropId: d.id });
      }
      setDone((n) => n + 1);
      load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setMerging(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cadastros duplicados"
        description="Cadastros que parecem a mesma pessoa (mesmo telefone ou e-mail). Escolha qual manter e mescle em um só."
      />

      <div className="mb-4">
        <Link
          href="/members"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Membros
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Procurando duplicados...
        </p>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">
              Nenhum cadastro duplicado encontrado.
            </p>
            {done > 0 && (
              <p className="text-sm text-slate-500">
                {done} {done === 1 ? 'grupo mesclado' : 'grupos mesclados'} nesta
                sessão. 🎉
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {groups.length}{' '}
            {groups.length === 1
              ? 'grupo de duplicados'
              : 'grupos de duplicados'}{' '}
            encontrado{groups.length === 1 ? '' : 's'}.
          </p>
          {groups.map((group, gi) => {
            const keepId = keepBy[gi] ?? group.suggestedKeepId;
            return (
              <Card key={group.members.map((m) => m.id).join('-')}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-indigo-600" />
                    {group.members.length} cadastros parecidos
                  </div>

                  <div className="space-y-2">
                    {group.members.map((m) => {
                      const keeping = m.id === keepId;
                      return (
                        <label
                          key={m.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                            keeping
                              ? 'border-indigo-400 bg-indigo-50/50'
                              : 'border-border hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`keep-${gi}`}
                            checked={keeping}
                            onChange={() =>
                              setKeepBy((s) => ({ ...s, [gi]: m.id }))
                            }
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {m.name}
                              </span>
                              <Badge variant={STATUS_VARIANTS[m.status]}>
                                {STATUS_LABELS[m.status]}
                              </Badge>
                              {m.role && (
                                <span className="text-xs text-indigo-600">
                                  {roleLabel(m.role, m.gender)}
                                </span>
                              )}
                              {m.portalStatus !== 'NONE' && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  portal: {m.portalStatus.toLowerCase()}
                                </span>
                              )}
                              {keeping && (
                                <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  MANTER
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                              {m.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {m.email}
                                </span>
                              )}
                              {m.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {m.phone}
                                </span>
                              )}
                              {m.city && <span>{m.city}</span>}
                              <span>
                                Entrada:{' '}
                                {m.joinedAt ? formatDate(m.joinedAt) : '—'}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-xs text-slate-400">
                      Vamos manter o selecionado e unir os dados/atividade dos
                      outros nele.
                    </p>
                    <Button
                      onClick={() => mergeGroup(gi, group)}
                      disabled={merging === gi}
                    >
                      {merging === gi ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Merge className="h-4 w-4" />
                      )}
                      Mesclar em um
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
