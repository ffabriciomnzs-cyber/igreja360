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
  Network,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { Cell, PaginatedCells } from '@/lib/cells';

export default function CellsPage(): React.ReactElement {
  const [cells, setCells] = useState<Cell[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaginatedCells>('/cells', {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
          active: active || undefined,
        },
      });
      setCells(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, active]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleDelete(cell: Cell): Promise<void> {
    const ok = window.confirm(
      `Remover a célula ${cell.name}? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setDeletingId(cell.id);
    try {
      await api.delete(`/cells/${cell.id}`);
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
        title="Células"
        description="Gestão das células, líderes e reuniões."
        action={
          <Link href="/cells/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nova célula
            </Button>
          </Link>
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
              placeholder="Buscar por nome ou bairro"
              className="pl-9"
            />
          </div>
          <Select
            value={active}
            onChange={(e) => {
              setPage(1);
              setActive(e.target.value);
            }}
            className="sm:w-48"
          >
            <option value="">Todas</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
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
              Carregando células...
            </div>
          ) : cells.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Network className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                Nenhuma célula encontrada
              </p>
              <p className="text-sm text-slate-500">
                Cadastre a primeira célula para começar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Célula</th>
                    <th className="px-4 py-3 font-medium">Líder</th>
                    <th className="px-4 py-3 font-medium">Encontro</th>
                    <th className="px-4 py-3 font-medium">Membros</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cells.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/cells/${c.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {c.name}
                        </Link>
                        {c.neighborhood && (
                          <p className="text-xs text-slate-500">
                            {c.neighborhood}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.leaderName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.dayOfWeek || c.time
                          ? `${c.dayOfWeek ?? ''}${
                              c.dayOfWeek && c.time ? ' · ' : ''
                            }${c.time ?? ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c._count?.members ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.active ? 'success' : 'muted'}>
                          {c.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/cells/${c.id}`}>
                            <Button variant="ghost" size="icon" title="Ver">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/cells/${c.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remover"
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? (
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
          )}
        </CardContent>
      </Card>

      {!loading && cells.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            {total} {total === 1 ? 'célula' : 'células'}
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
