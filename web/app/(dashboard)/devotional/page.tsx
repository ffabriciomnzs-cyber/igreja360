'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Upload, Trash2, Coffee, Layers } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, extractApiError } from '@/lib/api';
import { fileToCompressedDataUrl } from '@/lib/image';

function brToday(): string {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${br.getUTCFullYear()}-${pad(br.getUTCMonth() + 1)}-${pad(br.getUTCDate())}`;
}

interface DevotionalForm {
  title: string;
  verseRef: string;
  verseText: string;
  reflection: string;
  songTitle: string;
  songUrl: string;
}

const EMPTY: DevotionalForm = {
  title: '',
  verseRef: '',
  verseText: '',
  reflection: '',
  songTitle: '',
  songUrl: '',
};

export default function DevotionalAdminPage(): React.ReactElement {
  const [date, setDate] = useState(brToday());
  const [form, setForm] = useState<DevotionalForm>(EMPTY);
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMsg(null);
    api
      .get<
        (DevotionalForm & { image: string | null }) | null
      >(`/devotionals/${date}`)
      .then(({ data }) => {
        if (!mounted) return;
        if (data) {
          setForm({
            title: data.title ?? '',
            verseRef: data.verseRef ?? '',
            verseText: data.verseText ?? '',
            reflection: data.reflection ?? '',
            songTitle: data.songTitle ?? '',
            songUrl: data.songUrl ?? '',
          });
          setImage(data.image ?? '');
        } else {
          setForm(EMPTY);
          setImage('');
        }
      })
      .catch((err) => {
        if (mounted) setError(extractApiError(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [date]);

  function update<K extends keyof DevotionalForm>(k: K, v: string): void {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleImage(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }
    try {
      setImage(await fileToCompressedDataUrl(file, 1080, 0.85));
      setError(null);
    } catch {
      setError('Não foi possível carregar a imagem.');
    } finally {
      if (imgRef.current) imgRef.current.value = '';
    }
  }

  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setMsg(null);
    setError(null);
    if (form.reflection.trim().length < 2) {
      setError('Escreva a reflexão do dia.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/devotionals', {
        date,
        title: form.title.trim() || undefined,
        verseRef: form.verseRef.trim() || undefined,
        verseText: form.verseText.trim() || undefined,
        reflection: form.reflection.trim(),
        songTitle: form.songTitle.trim() || undefined,
        songUrl: form.songUrl.trim() || undefined,
        image: image || undefined,
      });
      setMsg('Devocional salvo! Os membros verão no dia selecionado.');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Devocional"
        description="Prepare o devocional diário (estilo Café com Deus Pai) para os membros."
      />

      <div className="mb-4">
        <Link
          href="/devotional/planos"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
        >
          <Layers className="h-4 w-4" />
          Planos de leitura (séries temáticas)
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coffee className="h-4 w-4 text-indigo-600" />
            Devocional do dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            {msg && (
              <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {msg}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Ex.: Deus cuida de você"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verseRef">Referência do versículo</Label>
                <Input
                  id="verseRef"
                  value={form.verseRef}
                  onChange={(e) => update('verseRef', e.target.value)}
                  placeholder="Ex.: Salmos 23:1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verseText">Texto do versículo</Label>
                <Input
                  id="verseText"
                  value={form.verseText}
                  onChange={(e) => update('verseText', e.target.value)}
                  placeholder="O Senhor é o meu pastor..."
                />
              </div>
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                carregando devocional desta data...
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="reflection">Mensagem de reflexão *</Label>
              <Textarea
                id="reflection"
                value={form.reflection}
                onChange={(e) => update('reflection', e.target.value)}
                className="min-h-[160px]"
                placeholder="Escreva a mensagem/reflexão do dia..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="songTitle">Música do dia (título)</Label>
                <Input
                  id="songTitle"
                  value={form.songTitle}
                  onChange={(e) => update('songTitle', e.target.value)}
                  placeholder="Ex.: Deus Proverá"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="songUrl">Link da música</Label>
                <Input
                  id="songUrl"
                  value={form.songUrl}
                  onChange={(e) => update('songUrl', e.target.value)}
                  placeholder="YouTube, Spotify..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem para compartilhar (redes sociais)</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-50">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Imagem"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-300">sem imagem</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={imgRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imgRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Enviar imagem
                  </Button>
                  {image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setImage('')}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar devocional
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
