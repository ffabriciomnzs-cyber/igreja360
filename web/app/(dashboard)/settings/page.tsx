'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, Trash2, Church as ChurchIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { fileToCompressedDataUrl } from '@/lib/image';
import { ChurchSettings } from '@/lib/settings';

export default function SettingsPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [church, setChurch] = useState<ChurchSettings | null>(null);
  const [form, setForm] = useState({
    name: '',
    denomination: '',
    phone: '',
    email: '',
    site: '',
    serviceHours: '',
    address: '',
  });
  const [logo, setLogo] = useState<string>('');
  const [savingChurch, setSavingChurch] = useState(false);
  const [churchMsg, setChurchMsg] = useState<string | null>(null);
  const [churchErr, setChurchErr] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<ChurchSettings>('/settings/church')
      .then(({ data }) => {
        if (!mounted) return;
        setChurch(data);
        setLogo(data.logo ?? '');
        setForm({
          name: data.name ?? '',
          denomination: data.denomination ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          site: data.site ?? '',
          serviceHours: data.serviceHours ?? '',
          address: data.address ?? '',
        });
      })
      .catch((err) => {
        if (mounted) setChurchErr(extractApiError(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogo(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setChurchErr('Selecione um arquivo de imagem.');
      return;
    }
    try {
      setLogo(await fileToCompressedDataUrl(file, 256));
      setChurchErr(null);
    } catch {
      setChurchErr('Não foi possível carregar a imagem.');
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  async function saveChurch(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setChurchMsg(null);
    setChurchErr(null);
    setSavingChurch(true);
    try {
      await api.patch('/settings/church', {
        name: form.name.trim(),
        logo,
        denomination: form.denomination.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        site: form.site.trim() || undefined,
        serviceHours: form.serviceHours.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setChurchMsg('Dados da igreja atualizados com sucesso.');
      // Atualiza o menu lateral na hora (sem precisar recarregar a página).
      window.dispatchEvent(new Event('igreja360:church-updated'));
    } catch (err) {
      setChurchErr(extractApiError(err));
    } finally {
      setSavingChurch(false);
    }
  }

  async function savePassword(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setPwdMsg(null);
    setPwdErr(null);
    if (pwd.newPassword.length < 6) {
      setPwdErr('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    setSavingPwd(true);
    try {
      await api.post('/settings/change-password', pwd);
      setPwdMsg('Senha alterada com sucesso.');
      setPwd({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwdErr(extractApiError(err));
    } finally {
      setSavingPwd(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando configurações...
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Dados da igreja e da sua conta."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados da igreja</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveChurch} className="space-y-4">
              {churchMsg && (
                <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {churchMsg}
                </div>
              )}
              {churchErr && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {churchErr}
                </div>
              )}
              <div className="space-y-2">
                <Label>Logo da igreja</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-50">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ChurchIcon className="h-7 w-7 text-slate-300" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Enviar logo
                    </Button>
                    {logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogo('')}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Aparece no menu lateral. Use PNG ou JPG quadrado.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nome da igreja *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="denomination">Denominação</Label>
                  <Input
                    id="denomination"
                    value={form.denomination}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, denomination: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    value={form.site}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, site: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="serviceHours">Horários de culto</Label>
                  <Input
                    id="serviceHours"
                    value={form.serviceHours}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, serviceHours: e.target.value }))
                    }
                    placeholder="Ex.: Domingo 18h, Quarta 19h30"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={savingChurch}>
                  {savingChurch && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trocar senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              {pwdMsg && (
                <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {pwdMsg}
                </div>
              )}
              {pwdErr && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pwdErr}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={pwd.currentPassword}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={pwd.newPassword}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, newPassword: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingPwd}>
                {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {church && (
        <p className="mt-4 text-xs text-slate-400">
          Identificador da igreja: {church.slug}
        </p>
      )}
    </div>
  );
}
