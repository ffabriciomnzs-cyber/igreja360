'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Pencil, Trash2, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Campaign,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_VARIANTS,
} from '@/lib/campaigns';

export default function CampaignsPage(): React.ReactElement {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Campaign[]>('/campaigns');
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

  async function handleDelete(c: Campaign): Promise<void> {
    if (!window.confirm(`Remover a campanha ${c.title}?`)) return;
    setDeletingId(c.id);
    try {
      await api.delete(`/campaigns/${c.id}`);
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
        title="Campanhas"
        description="Campanhas e metas de arrecadação."
        action={
          <Link href="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nova campanha
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
            Carregando campanhas...
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Megaphone className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              Nenhuma campanha cadastrada
            </p>
            <p className="text-sm text-slate-500">
              Crie uma campanha com meta de arrecadação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((c) => {
            const goal = c.goal ? Number(c.goal) : 0;
            const current = c.current ? Number(c.current) : 0;
            const pct =
              goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
            return (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500">{c.type}</p>
                    </div>
                    <Badge variant={CAMPAIGN_STATUS_VARIANTS[c.status]}>
                      {CAMPAIGN_STATUS_LABELS[c.status]}
                    </Badge>
                  </div>

                  {goal > 0 && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {formatCurrency(current)}
                        </span>
                        <span className="text-slate-500">
                          de {formatCurrency(goal)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs text-slate-500">
                        {pct}% da meta
                      </p>
                    </div>
                  )}

                  {c.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {c.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                    <Link href={`/campaigns/${c.id}/edit`}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
