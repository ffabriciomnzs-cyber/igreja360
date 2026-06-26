'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Communication,
  COMMUNICATION_TYPE_LABELS,
} from '@/lib/communications';

export default function CommunicationsPage(): React.ReactElement {
  const [items, setItems] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Communication[]>('/communications');
      setItems(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(c: Communication): Promise<void> {
    if (!window.confirm('Remover este comunicado?')) return;
    setDeletingId(c.id);
    try {
      await api.delete(`/communications/${c.id}`);
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
        title="Comunicações"
        description="Avisos e comunicados da igreja."
        action={
          <Link href="/communications/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo comunicado
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando comunicados...
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              Nenhum comunicado publicado
            </p>
            <p className="text-sm text-slate-500">
              Publique um aviso para a igreja.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <Badge variant="default">
                      {COMMUNICATION_TYPE_LABELS[c.type] ?? c.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/communications/${c.id}/edit`}>
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
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {c.content}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {formatDate(c.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
