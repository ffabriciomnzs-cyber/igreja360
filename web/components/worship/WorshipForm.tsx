'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { PaginatedMembers } from '@/lib/members';
import {
  WorshipService,
  WorshipItem,
  WorshipParticipant,
  WORSHIP_STATUS_OPTIONS,
  WORSHIP_STATUS_LABELS,
  WORSHIP_ITEM_SUGGESTIONS,
  WORSHIP_PARTICIPANT_ROLES,
} from '@/lib/worship';

interface ItemRow {
  title: string;
  responsible: string;
  durationMin: string;
  notes: string;
}

interface ParticipantRow {
  name: string;
  role: string;
  notes: string;
}

function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function WorshipForm({
  service,
}: {
  service?: WorshipService;
}): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(service);

  const [title, setTitle] = useState(service?.title ?? 'Culto');
  const [date, setDate] = useState(isoToLocal(service?.date ?? null));
  const [theme, setTheme] = useState(service?.theme ?? '');
  const [bibleRef, setBibleRef] = useState(service?.bibleRef ?? '');
  const [status, setStatus] = useState(service?.status ?? 'PLANNED');
  const [notes, setNotes] = useState(service?.notes ?? '');

  const [items, setItems] = useState<ItemRow[]>(
    service?.items.map((i) => ({
      title: i.title,
      responsible: i.responsible ?? '',
      durationMin: i.durationMin != null ? String(i.durationMin) : '',
      notes: i.notes ?? '',
    })) ?? [],
  );
  const [participants, setParticipants] = useState<ParticipantRow[]>(
    service?.participants.map((p) => ({
      name: p.name,
      role: p.role,
      notes: p.notes ?? '',
    })) ?? [],
  );

  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api
      .get<PaginatedMembers>('/members', { params: { limit: 500 } })
      .then(({ data }) => setMemberNames(data.data.map((m) => m.name)))
      .catch(() => undefined);
  }, []);

  // --- Itens (ordem do culto) ---
  const addItem = (preset?: string) =>
    setItems((prev) => [
      ...prev,
      { title: preset ?? '', responsible: '', durationMin: '', notes: '' },
    ]);
  const updateItem = (i: number, key: keyof ItemRow, value: string) =>
    setItems((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const moveItem = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // --- Participantes (escala / convidados) ---
  const addParticipant = () =>
    setParticipants((prev) => [...prev, { name: '', role: '', notes: '' }]);
  const updateParticipant = (
    i: number,
    key: keyof ParticipantRow,
    value: string,
  ) =>
    setParticipants((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );
  const removeParticipant = (i: number) =>
    setParticipants((prev) => prev.filter((_, idx) => idx !== i));

  interface AiSuggestion {
    theme: string;
    bibleRef: string;
    summary: string;
    items: {
      title: string;
      responsible: string;
      durationMin: number;
      notes: string;
    }[];
    participantRoles: string[];
  }

  async function generateWithAi(): Promise<void> {
    setError(null);
    if (title.trim().length < 2) {
      setError('Informe um título antes de gerar a sugestão.');
      return;
    }
    if (
      (items.length > 0 || participants.length > 0) &&
      !confirm(
        'A sugestão vai substituir a ordem do culto e os participantes atuais. Continuar?',
      )
    ) {
      return;
    }

    setGenerating(true);
    try {
      const { data } = await api.post<AiSuggestion>('/worship/assist', {
        title: title.trim(),
        theme: theme.trim() || undefined,
        bibleRef: bibleRef.trim() || undefined,
      });
      if (data.theme) setTheme(data.theme);
      if (data.bibleRef) setBibleRef(data.bibleRef);
      if (data.summary && !notes.trim()) setNotes(data.summary);
      setItems(
        data.items.map((i) => ({
          title: i.title ?? '',
          responsible: i.responsible ?? '',
          durationMin: i.durationMin != null ? String(i.durationMin) : '',
          notes: i.notes ?? '',
        })),
      );
      setParticipants(
        data.participantRoles.map((role) => ({ name: '', role, notes: '' })),
      );
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError('Informe o título do culto.');
      return;
    }
    if (!date) {
      setError('Informe a data e o horário.');
      return;
    }

    const payload = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      theme: theme.trim() || undefined,
      bibleRef: bibleRef.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      items: items
        .filter((i) => i.title.trim())
        .map((i, idx) => ({
          order: idx,
          title: i.title.trim(),
          responsible: i.responsible.trim() || undefined,
          durationMin: i.durationMin ? Number(i.durationMin) : undefined,
          notes: i.notes.trim() || undefined,
        })),
      participants: participants
        .filter((p) => p.name.trim() && p.role.trim())
        .map((p) => ({
          name: p.name.trim(),
          role: p.role.trim(),
          notes: p.notes.trim() || undefined,
        })),
    };

    setSaving(true);
    try {
      if (editing && service) {
        await api.patch(`/worship/${service.id}`, payload);
      } else {
        await api.post('/worship', payload);
      }
      router.push('/worship');
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <datalist id="member-names">
        {memberNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Gerador de sugestão */}
      <div className="flex flex-col gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <p className="text-sm text-indigo-900">
            Preencha o <strong>título</strong> (e opcionalmente o tema) e gere
            uma sugestão automática de tema, texto-base, ordem do culto e
            funções a escalar.
          </p>
        </div>
        <Button
          type="button"
          onClick={generateWithAi}
          disabled={generating}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? 'Gerando...' : 'Gerar sugestão'}
        </Button>
      </div>

      {/* Dados do culto */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Culto de Domingo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date">Data e horário *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="theme">Tema da mensagem</Label>
              <Input
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex.: A graça que transforma"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bibleRef">Texto-base (Bíblia)</Label>
              <Input
                id="bibleRef"
                value={bibleRef}
                onChange={(e) => setBibleRef(e.target.value)}
                placeholder="Ex.: Efésios 2:8-10"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as typeof status)
                }
                className="mt-1"
              >
                {WORSHIP_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {WORSHIP_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações gerais sobre o culto."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ordem do culto */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <ListOrdered className="h-4 w-4 text-indigo-600" />
              Ordem do culto
            </h3>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhum item ainda. Adicione abaixo ou use uma sugestão.
            </p>
          )}

          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2 w-5 text-center text-sm font-semibold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,7rem]">
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(i, 'title', e.target.value)}
                      placeholder="Item (ex.: Louvor)"
                    />
                    <Input
                      value={item.responsible}
                      onChange={(e) =>
                        updateItem(i, 'responsible', e.target.value)
                      }
                      list="member-names"
                      placeholder="Responsável"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={item.durationMin}
                      onChange={(e) =>
                        updateItem(i, 'durationMin', e.target.value)
                      }
                      placeholder="min"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(i, -1)}
                      className="text-slate-400 hover:text-indigo-600"
                      title="Subir"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(i, 1)}
                      className="text-slate-400 hover:text-indigo-600"
                      title="Descer"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="mt-0.5 text-slate-400 hover:text-red-600"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  value={item.notes}
                  onChange={(e) => updateItem(i, 'notes', e.target.value)}
                  placeholder="Observação (opcional)"
                  className="mt-2"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem()}
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
            {WORSHIP_ITEM_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addItem(s)}
                className="rounded-full border border-border px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
              >
                + {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participantes / escala */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            Participantes / escala
          </h3>

          {participants.length === 0 && (
            <p className="text-sm text-slate-400">
              Convide pessoas para participar (pregação, louvor, oração...).
            </p>
          )}

          <div className="space-y-3">
            {participants.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr,1fr,1fr,auto]"
              >
                <Input
                  value={p.name}
                  onChange={(e) => updateParticipant(i, 'name', e.target.value)}
                  list="member-names"
                  placeholder="Nome"
                />
                <Select
                  value={p.role}
                  onChange={(e) => updateParticipant(i, 'role', e.target.value)}
                >
                  <option value="">Função...</option>
                  {WORSHIP_PARTICIPANT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
                <Input
                  value={p.notes}
                  onChange={(e) => updateParticipant(i, 'notes', e.target.value)}
                  placeholder="Observação (opcional)"
                />
                <button
                  type="button"
                  onClick={() => removeParticipant(i)}
                  className="flex items-center justify-center px-2 text-slate-400 hover:text-red-600"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addParticipant}
          >
            <Plus className="h-4 w-4" />
            Adicionar participante
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/worship')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? 'Salvar alterações' : 'Criar culto'}
        </Button>
      </div>
    </form>
  );
}
