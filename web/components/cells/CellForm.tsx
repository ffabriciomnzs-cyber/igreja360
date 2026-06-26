'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { Cell, DAY_OPTIONS } from '@/lib/cells';
import { Member, PaginatedMembers } from '@/lib/members';

interface CellFormProps {
  cell?: Cell;
}

interface FormState {
  name: string;
  leaderId: string;
  coLeaderId: string;
  dayOfWeek: string;
  time: string;
  neighborhood: string;
  address: string;
  capacity: string;
  active: boolean;
}

export function CellForm({ cell }: CellFormProps): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(cell);

  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<FormState>({
    name: cell?.name ?? '',
    leaderId: cell?.leaderId ?? '',
    coLeaderId: cell?.coLeaderId ?? '',
    dayOfWeek: cell?.dayOfWeek ?? '',
    time: cell?.time ?? '',
    neighborhood: cell?.neighborhood ?? '',
    address: cell?.address ?? '',
    capacity: cell?.capacity != null ? String(cell.capacity) : '',
    active: cell?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<PaginatedMembers>('/members', { params: { limit: 100 } })
      .then(({ data }) => {
        if (mounted) setMembers(data.data);
      })
      .catch(() => {
        /* lista de líderes opcional */
      });
    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) {
      setError('Informe o nome da célula.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      leaderId: form.leaderId || undefined,
      coLeaderId: form.coLeaderId || undefined,
      dayOfWeek: form.dayOfWeek || undefined,
      time: form.time.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      address: form.address.trim() || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      active: form.active,
    };

    setSaving(true);
    try {
      if (editing && cell) {
        await api.patch(`/cells/${cell.id}`, payload);
      } else {
        await api.post('/cells', payload);
      }
      router.push('/cells');
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome da célula *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex.: Célula Esperança"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaderId">Líder</Label>
              <Select
                id="leaderId"
                value={form.leaderId}
                onChange={(e) => update('leaderId', e.target.value)}
              >
                <option value="">Sem líder</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coLeaderId">Co-líder</Label>
              <Select
                id="coLeaderId"
                value={form.coLeaderId}
                onChange={(e) => update('coLeaderId', e.target.value)}
              >
                <option value="">Sem co-líder</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Dia da semana</Label>
              <Select
                id="dayOfWeek"
                value={form.dayOfWeek}
                onChange={(e) => update('dayOfWeek', e.target.value)}
              >
                <option value="">Selecione</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                placeholder="Ex.: 20:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => update('neighborhood', e.target.value)}
                placeholder="Centro"
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
                placeholder="Ex.: 20"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => update('active', e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Célula ativa
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/cells')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Cadastrar célula'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
