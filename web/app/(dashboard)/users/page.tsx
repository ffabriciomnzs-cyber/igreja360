'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, extractApiError } from '@/lib/api';
import { ROLE_LABELS, getStoredUser } from '@/lib/auth';
import { ManagedUser, USER_ROLE_OPTIONS } from '@/lib/users';

interface FormState {
  name: string;
  email: string;
  role: string;
  password: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  role: 'MEMBER',
  password: '',
  active: true,
};

export default function UsersPage(): React.ReactElement {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load(): void {
    setLoading(true);
    api
      .get<ManagedUser[]>('/users')
      .then(({ data }) => setUsers(data))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setCurrentUserId(getStoredUser()?.id ?? '');
    load();
  }, []);

  function openNew(): void {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(u: ManagedUser): void {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
      active: u.active,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    if (form.name.trim().length < 2) {
      setFormError('Informe o nome.');
      return;
    }
    if (!form.email.trim()) {
      setFormError('Informe o e-mail.');
      return;
    }
    if (!editing && form.password.length < 6) {
      setFormError('Defina uma senha com ao menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/users/${editing.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          active: form.active,
          password: form.password.trim() || undefined,
        });
      } else {
        await api.post('/users', {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password,
        });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: ManagedUser): Promise<void> {
    if (!confirm(`Excluir o acesso de ${u.name}? Esta ação não pode ser desfeita.`))
      return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      setError(extractApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie as contas de acesso da igreja."
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo usuário
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-6">
            <form onSubmit={save} className="space-y-4">
              <p className="font-semibold text-slate-900">
                {editing ? 'Editar usuário' : 'Novo usuário'}
              </p>
              {formError && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="uname">Nome *</Label>
                  <Input
                    id="uname"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uemail">E-mail (login) *</Label>
                  <Input
                    id="uemail"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urole">Papel *</Label>
                  <Select
                    id="urole"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    {USER_ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] ?? r}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upass">
                    {editing
                      ? 'Nova senha (deixe em branco para manter)'
                      : 'Senha *'}
                  </Label>
                  <Input
                    id="upass"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>
                {editing && (
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, active: e.target.checked }))
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Conta ativa (pode fazer login)
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Salvar' : 'Criar usuário'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-400">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            Nenhum usuário cadastrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600">Nome</th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    E-mail
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">Papel</th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-xs text-slate-400">
                          (você)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.active ? 'success' : 'muted'}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {u.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => remove(u)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
