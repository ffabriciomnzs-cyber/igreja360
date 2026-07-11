'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Pencil,
  Check,
  X,
  Upload,
  HandHeart,
  Plus,
  BadgeCheck,
} from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import { fileToCompressedDataUrl } from '@/lib/image';
import { formatDate } from '@/lib/utils';
import {
  GENDER_LABELS,
  ROLE_LABELS,
  roleLabel,
  STATUS_LABELS,
  type Gender,
} from '@/lib/members';

interface MeMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  gender: Gender | null;
  photo: string | null;
  birthDate: string | null;
  baptismDate: string | null;
  address: string | null;
  city: string | null;
  status: keyof typeof STATUS_LABELS;
  role: keyof typeof ROLE_LABELS | null;
  joinedAt: string | null;
}
interface MeChurch {
  name: string;
  logo: string | null;
  cardLogo: string | null;
  denomination: string | null;
  phone: string | null;
  address: string | null;
}
interface Me {
  member: MeMember;
  church: MeChurch | null;
}
interface Prayer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string;
  createdAt: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

export default function PerfilPage(): React.ReactElement {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: '',
    birthDate: '',
    address: '',
    city: '',
    photo: '',
  });
  const photoRef = useRef<HTMLInputElement>(null);

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPublic, setPPublic] = useState(false);
  const [pSaving, setPSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      memberApi.get<Me>('/member-auth/me'),
      memberApi.get<Prayer[]>('/member-auth/prayers'),
    ])
      .then(([meRes, prRes]) => {
        if (!mounted) return;
        setMe(meRes.data);
        setPrayers(prRes.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function startEdit(): void {
    if (!me) return;
    setForm({
      name: me.member.name ?? '',
      phone: me.member.phone ?? '',
      gender: me.member.gender ?? '',
      birthDate: toDateInput(me.member.birthDate),
      address: me.member.address ?? '',
      city: me.member.city ?? '',
      photo: me.member.photo ?? '',
    });
    setEditing(true);
  }

  async function handlePhoto(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToCompressedDataUrl(file, 512, 0.85);
      setForm((f) => ({ ...f, photo: url }));
    } catch {
      /* ignora */
    } finally {
      if (photoRef.current) photoRef.current.value = '';
    }
  }

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const { data } = await memberApi.patch<Me>('/member-auth/profile', {
        name: form.name,
        phone: form.phone,
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        address: form.address,
        city: form.city,
        photo: form.photo,
      });
      setMe(data);
      setEditing(false);
    } catch {
      /* ignora */
    } finally {
      setSaving(false);
    }
  }

  async function submitPrayer(): Promise<void> {
    if (pTitle.trim().length < 2) return;
    setPSaving(true);
    try {
      const { data } = await memberApi.post<Prayer>('/member-auth/prayers', {
        title: pTitle.trim(),
        description: pDesc.trim() || undefined,
        isPublic: pPublic,
      });
      setPrayers((list) => [data, ...list]);
      setPTitle('');
      setPDesc('');
      setPPublic(false);
    } catch {
      /* ignora */
    } finally {
      setPSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }
  if (!me) return <></>;

  const { member, church } = me;
  const churchName = church?.name ?? 'Igreja360';

  return (
    <div className="space-y-6">
      {/* Carteirinha digital */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-200">
              Carteirinha de Membro
            </p>
            <h2 className="mt-0.5 truncate text-base font-bold leading-tight">
              {churchName}
            </h2>
            {church?.denomination && (
              <p className="truncate text-xs text-indigo-200">
                {church.denomination}
              </p>
            )}
          </div>
          {(church?.cardLogo || church?.logo) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.cardLogo || church.logo || ''}
              alt="Logo"
              className="h-14 w-14 shrink-0 object-contain"
            />
          )}
        </div>

        <div className="flex gap-4 px-5 py-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo}
                alt={member.name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(member.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {member.name}
            </h3>
            <p className="text-sm text-indigo-600">
              {member.role ? roleLabel(member.role, member.gender) : 'Membro'}
            </p>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Situação</dt>
                <dd className="font-medium text-slate-700">
                  {STATUS_LABELS[member.status]}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Membro desde</dt>
                <dd className="font-medium text-slate-700">
                  {member.joinedAt ? formatDate(member.joinedAt) : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[10px] text-slate-500">
          <p className="font-semibold text-slate-700">
            ID {member.id.slice(0, 8).toUpperCase()}
          </p>
          {church?.phone && <p>{church.phone}</p>}
        </div>
      </div>

      {/* Meus dados */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Meus dados</h2>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(form.name || member.name)
                )}
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              <button
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Trocar foto
              </button>
            </div>

            {(
              [
                ['name', 'Nome completo', 'text'],
                ['phone', 'Telefone', 'tel'],
                ['birthDate', 'Nascimento', 'date'],
                ['city', 'Cidade', 'text'],
                ['address', 'Endereço', 'text'],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Sexo
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gender: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Não informado</option>
                <option value="MALE">{GENDER_LABELS.MALE}</option>
                <option value="FEMALE">{GENDER_LABELS.FEMALE}</option>
              </select>
            </div>
            <p className="text-xs text-slate-400">
              Para alterar seu e-mail de acesso, fale com a secretaria.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <dl className="divide-y divide-slate-100 rounded-2xl border border-border bg-white px-4">
            {(
              [
                ['E-mail', member.email],
                ['Telefone', member.phone],
                [
                  'Nascimento',
                  member.birthDate ? formatDate(member.birthDate) : null,
                ],
                ['Cidade', member.city],
                ['Endereço', member.address],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-2.5">
                <dt className="text-sm text-slate-400">{label}</dt>
                <dd className="text-right text-sm font-medium text-slate-700">
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Pedidos de oração */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <HandHeart className="h-4 w-4 text-indigo-600" />
          Meus pedidos de oração
        </h2>

        <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <input
            value={pTitle}
            onChange={(e) => setPTitle(e.target.value)}
            placeholder="Pelo que a igreja pode orar?"
            maxLength={160}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <textarea
            value={pDesc}
            onChange={(e) => setPDesc(e.target.value)}
            placeholder="Conte mais, se quiser (opcional)"
            maxLength={2000}
            className="min-h-[70px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={pPublic}
              onChange={(e) => setPPublic(e.target.checked)}
            />
            Permitir compartilhar com a igreja (senão, só a liderança vê)
          </label>
          <div className="flex justify-end">
            <button
              onClick={submitPrayer}
              disabled={pSaving || pTitle.trim().length < 2}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {pSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Enviar pedido
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {prayers.length === 0 ? (
            <p className="rounded-2xl border border-border bg-white p-4 text-center text-sm text-slate-400">
              Você ainda não enviou pedidos.
            </p>
          ) : (
            prayers.map((p) => {
              const answered = p.status === 'ANSWERED';
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{p.title}</p>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        answered
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {answered ? (
                        <BadgeCheck className="h-3 w-3" />
                      ) : (
                        <HandHeart className="h-3 w-3" />
                      )}
                      {answered ? 'Respondida' : 'Em oração'}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
