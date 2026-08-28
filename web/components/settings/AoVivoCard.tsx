'use client';

// Transmissão ao vivo no painel: cola o link do YouTube e entra ao vivo.
// Ao ligar, todos os membros recebem notificação e o player aparece dentro
// do app — a igreja não perde ninguém no caminho para o YouTube.

import { useCallback, useEffect, useState } from 'react';
import { Radio, Loader2, ExternalLink, CircleStop } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, extractApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Live {
  active: boolean;
  title: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
  url: string | null;
}

export function AoVivoCard(): React.ReactElement {
  const [live, setLive] = useState<Live | null>(null);
  const [url, setUrl] = useState('');
  const [titulo, setTitulo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carrega = useCallback(() => {
    api
      .get<Live>('/settings/live')
      .then(({ data }) => {
        setLive(data);
        setUrl(data.url ?? '');
        setTitulo(data.title ?? '');
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    carrega();
  }, [carrega]);

  async function altera(active: boolean): Promise<void> {
    setSalvando(true);
    try {
      const { data } = await api.put<Live>('/settings/live', {
        url: url.trim(),
        title: titulo.trim() || undefined,
        active,
      });
      setLive(data);
      toast.success(
        active
          ? 'No ar! Os membros receberam a notificação e já podem assistir pelo app.'
          : 'Transmissão encerrada.',
      );
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio
            className={`h-4 w-4 ${live?.active ? 'text-red-500' : 'text-slate-400'}`}
          />
          Transmissão ao vivo
          {live?.active && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              NO AR
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Transmita pelo YouTube como sempre e cole o link aqui. O culto passa a
          aparecer dentro do aplicativo, e todo mundo recebe um aviso no celular.
        </p>

        <div>
          <Label htmlFor="live-url">Link do YouTube</Label>
          <Input
            id="live-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Vale o link do vídeo, o encurtado (youtu.be) ou o do canal.
          </p>
        </div>

        <div>
          <Label htmlFor="live-titulo">Título (opcional)</Label>
          <Input
            id="live-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Culto de domingo — 19h"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {live?.active ? (
            <Button
              variant="destructive"
              onClick={() => altera(false)}
              disabled={salvando}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CircleStop className="h-4 w-4" />
              )}
              Encerrar transmissão
            </Button>
          ) : (
            <Button onClick={() => altera(true)} disabled={salvando || !url.trim()}>
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Radio className="h-4 w-4" />
              )}
              Entrar ao vivo
            </Button>
          )}
          {live?.watchUrl && (
            <a href={live.watchUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" />
                Abrir no YouTube
              </Button>
            </a>
          )}
        </div>

        {live?.active && live.embedUrl && (
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={live.embedUrl}
              title="Prévia da transmissão"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
