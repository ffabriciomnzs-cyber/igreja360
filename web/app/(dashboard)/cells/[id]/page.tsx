'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CellDetail } from '@/lib/cells';
import { STATUS_LABELS, STATUS_VARIANTS } from '@/lib/members';

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || '—'}</p>
    </div>
  );
}

export default function CellDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const [cell, setCell] = useState<CellDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [mDate, setMDate] = useState('');
  const [mTheme, setMTheme] = useState('');
  const [mAttendees, setMAttendees] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<CellDetail>(`/cells/${params.id}`);
      setCell(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddMeeting(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setMeetingError(null);
    if (!mDate) {
      setMeetingError('Informe a data da reunião.');
      return;
    }
    setSavingMeeting(true);
    try {
      await api.post(`/cells/${params.id}/meetings`, {
        date: new Date(mDate).toISOString(),
        theme: mTheme.trim() || undefined,
        attendees: mAttendees ? Number(mAttendees) : undefined,
        notes: mNotes.trim() || undefined,
      });
      setMDate('');
      setMTheme('');
      setMAttendees('');
      setMNotes('');
      setShowForm(false);
      await load();
    } catch (err) {
      setMeetingError(extractApiError(err));
    } finally {
      setSavingMeeting(false);
    }
  }

  async function handleDeleteMeeting(meetingId: string): Promise<void> {
    if (!window.confirm('Remover esta reunião?')) return;
    try {
      await api.delete(`/cells/${params.id}/meetings/${meetingId}`);
      await load();
    } catch (err) {
      setMeetingError(extractApiError(err));
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </CardContent>
      </Card>
    );
  }

  if (error || !cell) {
    return (
      <div>
        <Link href="/cells">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Célula não encontrada.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/cells">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <PageHeader
        title={cell.name}
        description="Detalhes da célula."
        action={
          <div className="flex items-center gap-2">
            <Badge variant={cell.active ? 'success' : 'muted'}>
              {cell.active ? 'Ativa' : 'Inativa'}
            </Badge>
            <Link href={`/cells/${cell.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Líder" value={cell.leaderName} />
            <Field label="Co-líder" value={cell.coLeaderName} />
            <Field
              label="Encontro"
              value={
                cell.dayOfWeek || cell.time
                  ? `${cell.dayOfWeek ?? ''}${
                      cell.dayOfWeek && cell.time ? ' · ' : ''
                    }${cell.time ?? ''}`
                  : null
              }
            />
            <Field label="Bairro" value={cell.neighborhood} />
            <Field label="Capacidade" value={cell.capacity} />
            <Field label="Endereço" value={cell.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Membros ({cell.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cell.members.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Nenhum membro vinculado. Vincule membros pela edição do membro.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {cell.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-2"
                  >
                    <Link
                      href={`/members/${m.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-indigo-600"
                    >
                      {m.name}
                    </Link>
                    <Badge variant={STATUS_VARIANTS[m.status]}>
                      {STATUS_LABELS[m.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Reuniões ({cell.meetings.length})
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Registrar reunião
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form
              onSubmit={handleAddMeeting}
              className="mb-5 rounded-lg border border-border p-4"
            >
              {meetingError && (
                <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {meetingError}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mDate">Data *</Label>
                  <Input
                    id="mDate"
                    type="date"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mAttendees">Presentes</Label>
                  <Input
                    id="mAttendees"
                    type="number"
                    min={0}
                    value={mAttendees}
                    onChange={(e) => setMAttendees(e.target.value)}
                    placeholder="Ex.: 12"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mTheme">Tema</Label>
                  <Input
                    id="mTheme"
                    value={mTheme}
                    onChange={(e) => setMTheme(e.target.value)}
                    placeholder="Tema do encontro"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mNotes">Anotações</Label>
                  <Textarea
                    id="mNotes"
                    value={mNotes}
                    onChange={(e) => setMNotes(e.target.value)}
                    placeholder="Observações da reunião"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  disabled={savingMeeting}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={savingMeeting}>
                  {savingMeeting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar reunião
                </Button>
              </div>
            </form>
          )}

          {cell.meetings.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Nenhuma reunião registrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Tema</th>
                    <th className="px-3 py-2 font-medium">Presentes</th>
                    <th className="px-3 py-2 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cell.meetings.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 text-slate-700">
                        {formatDate(m.date)}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {m.theme || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {m.attendees ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remover"
                            onClick={() => handleDeleteMeeting(m.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
