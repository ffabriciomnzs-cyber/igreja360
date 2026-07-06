'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Users,
  Upload,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Member,
  PaginatedMembers,
  STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_VARIANTS,
  ROLE_LABELS,
} from '@/lib/members';

export default function MembersPage(): React.ReactElement {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    api
      .get<unknown[]>('/members/portal/pending')
      .then(({ data }) =>
        setPendingRequests(Array.isArray(data) ? data.length : 0),
      )
      .catch(() => undefined);
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedMembers>('/members', {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
          status: status || undefined,
        },
      });
      setMembers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleDelete(member: Member): Promise<void> {
    const ok = window.confirm(
      `Remover ${member.name}? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setDeletingId(member.id);
    try {
      await api.delete(`/members/${member.id}`);
      await load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Membros"
        description="Cadastro e gestão dos membros da igreja."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/members/portal-requests">
              <Button variant="outline" className="relative">
                <UserCheck className="h-4 w-4" />
                Solicitações
                {pendingRequests > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {pendingRequests}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/members/import">
              <Button variant="outline">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </Link>
            <Link href="/members/new">
              <Button>
                <Plus className="h-4 w-4" />
                Novo membro
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Buscar por nome, email, telefone ou CPF"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="sm:w-48"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando membros...
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                Nenhum membro encontrado
              </p>
              <p className="text-sm text-slate-500">
                Cadastre o primeiro membro para começar.
              </p>
            </div>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Contato</th>
                    <th className="px-4 py-3 font-medium">Cargo</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Entrada</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/members/${m.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {m.name}
                        </Link>
                        {m.city && (
                          <p className="text-xs text-slate-500">{m.city}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {m.email && <p>{m.email}</p>}
                        {m.phone && (
                          <p className="text-xs text-slate-500">{m.phone}</p>
                        )}
                        {!m.email && !m.phone && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {m.role ? ROLE_LABELS[m.role] : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[m.status]}>
                          {STATUS_LABELS[m.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {m.joinedAt ? formatDate(m.joinedAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/members/${m.id}`}>
                            <Button variant="ghost" size="icon" title="Ver">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/members/${m.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remover"
                            onClick={() => handleDelete(m)}
                            disabled={deletingId === m.id}
                          >
                            {deletingId === m.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border md:hidden">
              {members.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/members/${m.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {m.name}
                      </Link>
                      {m.city && (
                        <p className="text-xs text-slate-500">{m.city}</p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANTS[m.status]}>
                      {STATUS_LABELS[m.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                    {m.email && <p className="truncate">{m.email}</p>}
                    {m.phone && (
                      <p className="text-xs text-slate-500">{m.phone}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {m.role ? ROLE_LABELS[m.role] : 'Sem cargo'} · Entrada:{' '}
                      {m.joinedAt ? formatDate(m.joinedAt) : '—'}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/members/${m.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/members/${m.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remover"
                      onClick={() => handleDelete(m)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {!loading && members.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            {total} {total === 1 ? 'membro' : 'membros'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
