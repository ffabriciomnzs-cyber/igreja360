'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { fileToCompressedDataUrl } from '@/lib/image';
import { Event, EVENT_TYPES } from '@/lib/events';

interface EventFormProps {
  event?: Event;
}

interface FormState {
  name: string;
  type: string;
  date: string;
  endDate: string;
  location: string;
  capacity: string;
  description: string;
}

function isoToDateTimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ event }: EventFormProps): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(event);

  const [form, setForm] = useState<FormState>({
    name: event?.name ?? '',
    type: event?.type ?? '',
    date: isoToDateTimeLocal(event?.date ?? null),
    endDate: isoToDateTimeLocal(event?.endDate ?? null),
    location: event?.location ?? '',
    capacity: event?.capacity != null ? String(event.capacity) : '',
    description: event?.description ?? '',
  });
  const [photo, setPhoto] = useState<string>(event?.photo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }
    try {
      setPhoto(await fileToCompressedDataUrl(file));
      setError(null);
    } catch {
      setError('Não foi possível carregar a imagem.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError('Informe o nome do evento.');
      return;
    }
    if (!form.date) {
      setError('Informe a data e o horário.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type || undefined,
      date: new Date(form.date).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      location: form.location.trim() || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      description: form.description.trim() || undefined,
      photo,
    };

    setSaving(true);
    try {
      if (editing && event) {
        await api.patch(`/events/${event.id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      router.push('/events');
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Banner do evento</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-xs text-slate-400 ring-1 ring-slate-200">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt="Banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  'Sem imagem'
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {photo ? 'Trocar' : 'Enviar'}
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhoto('')}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome do evento *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex.: Conferência de Avivamento"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                id="type"
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
              >
                <option value="">Selecione</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Templo Sede"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Início *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Término</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => update('capacity', e.target.value)}
                placeholder="Ex.: 200"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Detalhes do evento"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/events')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Cadastrar evento'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
