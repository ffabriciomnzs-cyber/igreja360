'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  HandHeart,
  Check,
  Archive,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Prayer,
  PrayerStatus,
  PRAYER_STATUS_LABELS,
  PRAYER_STATUS_VARIANTS,
} from '@/lib/prayers';

export default function PrayersPage(): React.ReactElement {
  const [items, setItems] = useState<Prayer[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Prayer[]>('/prayers', {
        params: { status: status || undefined },
      });
      setItems(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setSaving(true);
    try {
      await api.post('/prayers', {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function setPrayerStatus(
    id: string,
    newStatus: PrayerStatus,
  ): Promise<void> {
    setBusyId(id);
    try {
      await api.patch(`/prayers/${id}`, { status: newStatus });
      await load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('Remover este pedido?')) return;
    setBusyId(id);
    try {
      await api.delete(`/prayers/${id}`);
      await load();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  const filters: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'ACTIVE', label: 'Em oração' },
    { value: 'ANSWERED', label: 'Respondidos' },
    { value: 'ARCHIVED', label: 'Arquivados' },
  ];

  return (
    <div>
      <PageHeader
        title="Orações"
        description="Pedidos de oração da igreja."
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Novo pedido
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Saúde da irmã Maria"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Detalhes</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o pedido (opcional)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 inline-flex rounded-md border border-input p-0.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando pedidos...
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <HandHeart className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              Nenhum pedido de oração
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <Badge variant={PRAYER_STATUS_VARIANTS[p.status]}>
                    {PRAYER_STATUS_LABELS[p.status]}
                  </Badge>
                </div>
                {p.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                    {p.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-400">
                  {formatDate(p.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {p.status !== 'ANSWERED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrayerStatus(p.id, 'ANSWERED')}
                      disabled={busyId === p.id}
                    >
                      <Check className="h-4 w-4" />
                      Respondido
                    </Button>
                  )}
                  {p.status !== 'ARCHIVED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrayerStatus(p.id, 'ARCHIVED')}
                      disabled={busyId === p.id}
                    >
                      <Archive className="h-4 w-4" />
                      Arquivar
                    </Button>
                  )}
                  {p.status !== 'ACTIVE' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrayerStatus(p.id, 'ACTIVE')}
                      disabled={busyId === p.id}
                    >
                      Reabrir
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remover"
                    className="ml-auto"
                    onClick={() => handleDelete(p.id)}
                    disabled={busyId === p.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
