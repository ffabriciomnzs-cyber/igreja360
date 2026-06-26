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
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  TransactionType,
} from '@/lib/financial';

interface TransactionFormProps {
  transaction?: Transaction;
}

interface FormState {
  type: TransactionType;
  category: string;
  amount: string;
  date: string;
  description: string;
}

function isoToDateInput(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  transaction,
}: TransactionFormProps): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(transaction);

  const [form, setForm] = useState<FormState>({
    type: transaction?.type ?? 'INCOME',
    category: transaction?.category ?? '',
    amount: transaction ? String(Number(transaction.amount)) : '',
    date: isoToDateInput(transaction?.date ?? null) || today(),
    description: transaction?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories =
    form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function update<K extends keyof FormState>(key: K, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount.replace(',', '.'));
    if (!form.category) {
      setError('Selecione uma categoria.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }

    const payload = {
      type: form.type,
      category: form.category,
      amount,
      date: new Date(form.date).toISOString(),
      description: form.description.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editing && transaction) {
        await api.patch(`/financial/${transaction.id}`, payload);
      } else {
        await api.post('/financial', payload);
      }
      router.push('/financial');
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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                update('type', 'INCOME');
                update('category', '');
              }}
              className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                form.type === 'INCOME'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-input text-slate-600 hover:bg-slate-50'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => {
                update('type', 'EXPENSE');
                update('category', '');
              }}
              className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                form.type === 'EXPENSE'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-input text-slate-600 hover:bg-slate-50'
              }`}
            >
              Despesa
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                id="category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="">Selecione</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Observação opcional"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/financial')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Lançar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
