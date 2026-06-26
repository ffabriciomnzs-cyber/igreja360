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
import {
  Member,
  ROLE_LABELS,
  ROLE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from '@/lib/members';

interface MemberFormProps {
  member?: Member;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  baptismDate: string;
  address: string;
  city: string;
  status: string;
  role: string;
  joinedAt: string;
}

function isoToDateInput(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function fileToCompressedDataUrl(
  file: File,
  max = 400,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function MemberForm({ member }: MemberFormProps): React.ReactElement {
  const router = useRouter();
  const editing = Boolean(member);

  const [form, setForm] = useState<FormState>({
    name: member?.name ?? '',
    email: member?.email ?? '',
    phone: member?.phone ?? '',
    cpf: member?.cpf ?? '',
    birthDate: isoToDateInput(member?.birthDate ?? null),
    baptismDate: isoToDateInput(member?.baptismDate ?? null),
    address: member?.address ?? '',
    city: member?.city ?? '',
    status: member?.status ?? 'ACTIVE',
    role: member?.role ?? '',
    joinedAt: isoToDateInput(member?.joinedAt ?? null),
  });
  const [photo, setPhoto] = useState<string>(member?.photo ?? '');
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
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhoto(dataUrl);
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
      setError('Informe o nome do membro.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      cpf: form.cpf.trim() || undefined,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      baptismDate: form.baptismDate
        ? new Date(form.baptismDate).toISOString()
        : undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      photo,
      status: form.status,
      role: form.role || undefined,
      joinedAt: form.joinedAt ? new Date(form.joinedAt).toISOString() : undefined,
    };

    setSaving(true);
    try {
      if (editing && member) {
        await api.patch(`/members/${member.id}`, payload);
      } else {
        await api.post('/members', payload);
      }
      router.push('/members');
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

          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xl font-bold text-indigo-600 ring-1 ring-slate-200">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="Foto do membro"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(form.name || '?')
              )}
            </div>
            <div className="space-y-1">
              <Label>Foto do membro</Label>
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
                  {photo ? 'Trocar foto' : 'Enviar foto'}
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
              <p className="text-xs text-slate-400">
                JPG ou PNG. A imagem é reduzida automaticamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex.: Maria Oliveira"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="email@exemplo.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={form.cpf}
                onChange={(e) => update('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baptismDate">Data de batismo</Label>
              <Input
                id="baptismDate"
                type="date"
                value={form.baptismDate}
                onChange={(e) => update('baptismDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Select
                id="role"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
              >
                <option value="">Sem cargo</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinedAt">Data de entrada</Label>
              <Input
                id="joinedAt"
                type="date"
                value={form.joinedAt}
                onChange={(e) => update('joinedAt', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/members')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Cadastrar membro'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
