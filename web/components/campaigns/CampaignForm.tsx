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
import { Campaign, CAMPAIGN_TYPES } from '@/lib/campaigns';

interface CampaignFormProps {
  campaign?: Campaign;
}

interface FormState {
  title: string;
  type: string;
  status: string;
  goal: string;
  current: string;
  startDate: string;
  endDate: string;
  description: string;
}

function dateInput(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

// Interpreta valor em formato brasileiro: ponto = milhar, vírgula = centavos.
// "25.000" -> 25000 | "25.000,50" -> 25000.5 | "25,50" -> 25.5
function parseMoney(raw: string): number | undefined {
  const s = raw.replace(/[R$\s]/g, '');
  if (!s) return undefined;
  const normalized = s.includes(',')
    ? s.replace(/\./g, '').replace(',', '.')
    : s.replace(/\./g, '');
  const n = Number(normalized);
  return isNaN(n) ? undefined : n;
}

// Formata um número para o campo (pt-BR), sem casas decimais desnecessárias.
function moneyInput(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function CampaignForm({
  campaign,
}: CampaignFormProps): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(campaign);

  const [form, setForm] = useState<FormState>({
    title: campaign?.title ?? '',
    type: campaign?.type ?? 'Financeira',
    status: campaign?.status ?? 'ACTIVE',
    goal: campaign?.goal != null ? moneyInput(Number(campaign.goal)) : '',
    current:
      campaign?.current != null ? moneyInput(Number(campaign.current)) : '',
    startDate: dateInput(campaign?.startDate ?? null),
    endDate: dateInput(campaign?.endDate ?? null),
    description: campaign?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (form.title.trim().length < 2) {
      setError('Informe o título da campanha.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      goal: parseMoney(form.goal),
      current: parseMoney(form.current),
      startDate: form.startDate
        ? new Date(form.startDate).toISOString()
        : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      description: form.description.trim() || undefined,
    };
    setSaving(true);
    try {
      if (editing && campaign) {
        await api.patch(`/campaigns/${campaign.id}`, payload);
      } else {
        await api.post('/campaigns', payload);
      }
      router.push('/campaigns');
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
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ex.: Campanha do Telhado"
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
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="ACTIVE">Ativa</option>
                <option value="PAUSED">Pausada</option>
                <option value="CLOSED">Encerrada</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Meta (R$)</Label>
              <Input
                id="goal"
                type="text"
                inputMode="decimal"
                value={form.goal}
                onChange={(e) => update('goal', e.target.value)}
                placeholder="Ex.: 25.000,00"
              />
              {parseMoney(form.goal) !== undefined && (
                <p className="text-xs text-slate-400">
                  ={' '}
                  {parseMoney(form.goal)!.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="current">Arrecadado (R$)</Label>
              <Input
                id="current"
                type="text"
                inputMode="decimal"
                value={form.current}
                onChange={(e) => update('current', e.target.value)}
                placeholder="Ex.: 1.500,00"
              />
              {parseMoney(form.current) !== undefined && (
                <p className="text-xs text-slate-400">
                  ={' '}
                  {parseMoney(form.current)!.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Início</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Término</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Detalhes da campanha"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/campaigns')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Criar campanha'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
