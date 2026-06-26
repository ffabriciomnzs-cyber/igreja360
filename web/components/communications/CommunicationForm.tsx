'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import {
  Communication,
  COMMUNICATION_TYPES,
  COMMUNICATION_TYPE_LABELS,
} from '@/lib/communications';

interface Props {
  communication?: Communication;
}

export function CommunicationForm({ communication }: Props): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(communication);

  const [title, setTitle] = useState(communication?.title ?? '');
  const [type, setType] = useState(communication?.type ?? 'NOTICE');
  const [content, setContent] = useState(communication?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 2 || content.trim().length < 2) {
      setError('Preencha título e conteúdo.');
      return;
    }
    const payload = { title: title.trim(), type, content: content.trim() };
    setSaving(true);
    try {
      if (editing && communication) {
        await api.patch(`/communications/${communication.id}`, payload);
      } else {
        await api.post('/communications', payload);
      }
      router.push('/communications');
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Culto especial neste domingo"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {COMMUNICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {COMMUNICATION_TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o comunicado..."
              className="min-h-[160px]"
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/communications')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Salvar' : 'Publicar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
