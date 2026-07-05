'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  ChevronLeft,
  GripVertical,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { fileToCompressedDataUrl } from '@/lib/image';

interface PlanListItem {
  id: string;
  title: string;
  description: string | null;
  cover: string | null;
  active: boolean;
  totalDays: number;
}

interface PlanDay {
  title: string;
  verseRef: string;
  verseText: string;
  reflection: string;
}

interface PlanForm {
  id?: string;
  title: string;
  description: string;
  cover: string;
  active: boolean;
  days: PlanDay[];
}

const EMPTY_DAY: PlanDay = {
  title: '',
  verseRef: '',
  verseText: '',
  reflection: '',
};

const NEW_PLAN: PlanForm = {
  title: '',
  description: '',
  cover: '',
  active: true,
  days: [{ ...EMPTY_DAY }],
};

export default function PlanosPage(): React.ReactElement {
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlanForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const loadPlans = (): void => {
    setLoading(true);
    api
      .get<PlanListItem[]>('/devotional-plans')
      .then(({ data }) => setPlans(data))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  async function openEdit(id: string): Promise<void> {
    setError(null);
    try {
      const { data } = await api.get<{
        id: string;
        title: string;
        description: string | null;
        cover: string | null;
        active: boolean;
        days: {
          title: string | null;
          verseRef: string | null;
          verseText: string | null;
          reflection: string;
        }[];
      }>(`/devotional-plans/${id}`);
      setEditing({
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        cover: data.cover ?? '',
        active: data.active,
        days: data.days.length
          ? data.days.map((d) => ({
              title: d.title ?? '',
              verseRef: d.verseRef ?? '',
              verseText: d.verseText ?? '',
              reflection: d.reflection,
            }))
          : [{ ...EMPTY_DAY }],
      });
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  function updateDay(idx: number, patch: Partial<PlanDay>): void {
    setEditing((p) =>
      p
        ? {
            ...p,
            days: p.days.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
          }
        : p,
    );
  }

  function addDay(): void {
    setEditing((p) => (p ? { ...p, days: [...p.days, { ...EMPTY_DAY }] } : p));
  }

  function removeDay(idx: number): void {
    setEditing((p) =>
      p && p.days.length > 1
        ? { ...p, days: p.days.filter((_, i) => i !== idx) }
        : p,
    );
  }

  async function handleCover(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    try {
      const url = await fileToCompressedDataUrl(file, 1080, 0.85);
      setEditing({ ...editing, cover: url });
    } catch {
      setError('Não foi possível carregar a imagem.');
    } finally {
      if (coverRef.current) coverRef.current.value = '';
    }
  }

  async function save(): Promise<void> {
    if (!editing) return;
    setError(null);
    if (editing.title.trim().length < 2) {
      setError('Dê um título ao plano.');
      return;
    }
    const days = editing.days.filter((d) => d.reflection.trim().length > 0);
    if (days.length === 0) {
      setError('Adicione ao menos um dia com reflexão.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/devotional-plans', {
        id: editing.id,
        title: editing.title.trim(),
        description: editing.description.trim() || undefined,
        cover: editing.cover || undefined,
        active: editing.active,
        days: days.map((d, i) => ({
          dayNumber: i + 1,
          title: d.title.trim() || undefined,
          verseRef: d.verseRef.trim() || undefined,
          verseText: d.verseText.trim() || undefined,
          reflection: d.reflection.trim(),
        })),
      });
      setEditing(null);
      loadPlans();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Excluir este plano? Os membros perderão o progresso.')) return;
    try {
      await api.delete(`/devotional-plans/${id}`);
      loadPlans();
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  // ---- Editor ----
  if (editing) {
    return (
      <div>
        <PageHeader
          title={editing.id ? 'Editar plano' : 'Novo plano de leitura'}
          description="Uma série de dias temáticos que os membros seguem no portal."
        />
        <button
          onClick={() => setEditing(null)}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar aos planos
        </button>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Informações do plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  placeholder="Ex.: 7 dias vencendo a ansiedade"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.active}
                    onChange={(e) =>
                      setEditing({ ...editing, active: e.target.checked })
                    }
                  />
                  Visível para os membros
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder="Do que se trata este plano..."
                className="min-h-[70px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Capa (opcional)</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-50">
                  {editing.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editing.cover}
                      alt="Capa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-300">sem capa</span>
                  )}
                </div>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCover}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Enviar capa
                </Button>
                {editing.cover && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing({ ...editing, cover: '' })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {editing.days.map((day, idx) => (
            <Card key={idx}>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                  <GripVertical className="h-4 w-4 text-slate-300" />
                  Dia {idx + 1}
                </CardTitle>
                {editing.days.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDay(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    value={day.title}
                    onChange={(e) => updateDay(idx, { title: e.target.value })}
                    placeholder="Título do dia (opcional)"
                  />
                  <Input
                    value={day.verseRef}
                    onChange={(e) =>
                      updateDay(idx, { verseRef: e.target.value })
                    }
                    placeholder="Referência (ex.: Salmos 23:1)"
                  />
                </div>
                <Input
                  value={day.verseText}
                  onChange={(e) =>
                    updateDay(idx, { verseText: e.target.value })
                  }
                  placeholder="Texto do versículo"
                />
                <Textarea
                  value={day.reflection}
                  onChange={(e) =>
                    updateDay(idx, { reflection: e.target.value })
                  }
                  placeholder="Reflexão do dia *"
                  className="min-h-[110px]"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={addDay}
        >
          <Plus className="h-4 w-4" />
          Adicionar dia
        </Button>

        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar plano
          </Button>
        </div>
      </div>
    );
  }

  // ---- Lista ----
  return (
    <div>
      <PageHeader
        title="Planos de leitura"
        description="Séries temáticas de devocional para os membros seguirem no portal."
      />
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/devotional"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Devocional diário
        </Link>
        <Button onClick={() => setEditing({ ...NEW_PLAN, days: [{ ...EMPTY_DAY }] })}>
          <Plus className="h-4 w-4" />
          Novo plano
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </p>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <Layers className="h-8 w-8" />
            <p className="text-sm">Nenhum plano criado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover}
                  alt={p.title}
                  className="h-28 w-full object-cover"
                />
              )}
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  {!p.active && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      oculto
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="line-clamp-2 text-sm text-slate-500">
                    {p.description}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  {p.totalDays} {p.totalDays === 1 ? 'dia' : 'dias'}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p.id)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(p.id)}
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
