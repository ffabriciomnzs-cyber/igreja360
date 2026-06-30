'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Radio as RadioIcon, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RADIO_STATIONS, RadioStation } from '@/lib/radio';

export default function RadioPage(): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);

  function selectStation(station: RadioStation): void {
    const audio = audioRef.current;
    if (!audio) return;

    if (current?.url === station.url) {
      if (playing) audio.pause();
      else void audio.play().catch(() => undefined);
      return;
    }

    setCurrent(station);
    setError(null);
    setLoading(true);
    audio.src = station.url;
    audio.load();
    void audio.play().catch(() => {
      setLoading(false);
      setPlaying(false);
      setError(`Não foi possível conectar à ${station.name}. Tente outra.`);
    });
  }

  function changeVolume(v: number): void {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  return (
    <div>
      <PageHeader
        title="Rádio"
        description="Ouça rádios gospel enquanto usa o sistema."
      />

      <audio
        ref={audioRef}
        onPlaying={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onError={() => {
          if (current) {
            setError(`Não foi possível conectar à ${current.name}. Tente outra.`);
          }
          setLoading(false);
          setPlaying(false);
        }}
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RADIO_STATIONS.map((station) => {
          const active = current?.url === station.url;
          const isPlaying = active && playing;
          const isLoading = active && loading;
          return (
            <button
              key={station.url}
              onClick={() => selectStation(station)}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-white p-4 text-left transition-colors hover:bg-slate-50',
                active ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-border',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-600',
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {station.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {station.description}
                </p>
              </div>
              {isPlaying && (
                <span className="flex items-end gap-0.5">
                  <span className="h-3 w-1 animate-pulse rounded bg-indigo-500" />
                  <span className="h-4 w-1 animate-pulse rounded bg-indigo-500 [animation-delay:150ms]" />
                  <span className="h-2 w-1 animate-pulse rounded bg-indigo-500 [animation-delay:300ms]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {current && (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <RadioIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {loading ? 'Conectando...' : playing ? 'Tocando agora' : 'Pausado'}
                </p>
                <p className="font-medium text-slate-900">{current.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-slate-400" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-32 accent-indigo-600"
              />
              <button
                onClick={() => selectStation(current)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-xs text-slate-400">
        As transmissões são de emissoras externas e podem ficar indisponíveis
        em alguns momentos.
      </p>
    </div>
  );
}
