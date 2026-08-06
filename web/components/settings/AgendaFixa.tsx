'use client';

// Agenda fixa de cultos: o que se repete toda semana ("terça, quinta e
// domingo, mesmo horário"). Aparece para o membro no portal, sem ninguém
// precisar cadastrar culto por culto.

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { api, extractApiError } from '@/lib/api';

const DIAS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

interface Linha {
  weekday: number;
  time: string;
  name: string;
  note: string;
}

export function AgendaFixa(): React.ReactElement {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .get<
        { weekday: number; time: string; name: string; note: string | null }[]
      >('/settings/service-schedules')
      .then(({ data }) => {
        if (!ativo) return;
        setLinhas(
          data.map((d) => ({
            weekday: d.weekday,
            time: d.time,
            name: d.name,
            note: d.note ?? '',
          })),
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  function adicionar(): void {
    setLinhas((l) => [
      ...l,
      { weekday: 0, time: '19:00', name: 'Culto', note: '' },
    ]);
  }

  function alterar(i: number, patch: Partial<Linha>): void {
    setLinhas((l) => l.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  }

  function remover(i: number): void {
    setLinhas((l) => l.filter((_, k) => k !== i));
  }

  async function salvar(): Promise<void> {
    setSaving(true);
    setMsg(null);
    setErro(null);
    try {
      await api.put('/settings/service-schedules', {
        schedules: linhas.map((l) => ({
          weekday: l.weekday,
          time: l.time,
          name: l.name.trim(),
          note: l.note.trim() || undefined,
        })),
      });
      setMsg('Agenda salva. Os membros já veem no portal.');
    } catch (err) {
      setErro(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Agenda fixa de cultos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O que acontece toda semana no mesmo horário. Aparece no portal do
          membro como “Agenda da semana” — não precisa cadastrar culto por
          culto.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <div className="space-y-3">
            {linhas.length === 0 && (
              <p className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                Nenhum horário fixo cadastrado.
              </p>
            )}

            {linhas.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[130px_100px_1fr_1fr_40px] sm:items-end"
              >
                <div>
                  <Label className="text-xs">Dia</Label>
                  <select
                    value={l.weekday}
                    onChange={(e) =>
                      alterar(i, { weekday: Number(e.target.value) })
                    }
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    {DIAS.map((d, k) => (
                      <option key={d} value={k}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Horário</Label>
                  <Input
                    type="time"
                    value={l.time}
                    onChange={(e) => alterar(i, { time: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nome do culto</Label>
                  <Input
                    value={l.name}
                    onChange={(e) => alterar(i, { name: e.target.value })}
                    placeholder="Culto de ensino"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Observação (opcional)</Label>
                  <Input
                    value={l.note}
                    onChange={(e) => alterar(i, { note: e.target.value })}
                    placeholder="Ceia no 1º domingo"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remover(i)}
                  aria-label="Remover horário"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={adicionar}>
              <Plus className="h-4 w-4" />
              Adicionar horário
            </Button>
          </div>
        )}

        {msg && (
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {msg}
          </div>
        )}
        {erro && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {erro}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar agenda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
