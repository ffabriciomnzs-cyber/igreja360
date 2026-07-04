'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Loader2, Radio as RadioIcon } from 'lucide-react';
import { RADIO_STATIONS, RadioStation } from '@/lib/radio';
import { cn } from '@/lib/utils';

export default function PortalRadioPage(): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  function selectStation(station: RadioStation): void {
    const audio = audioRef.current;
    if (!audio) return;
    if (current?.url === station.url) {
      if (playing) audio.pause();
      else void audio.play().catch(() => undefined);
      return;
    }
    setCurrent(station);
    setLoading(true);
    audio.src = station.url;
    audio.load();
    void audio.play().catch(() => {
      setLoading(false);
      setPlaying(false);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Rádio Gospel 📻</h1>
        <p className="text-sm text-slate-500">
          Ouça louvor enquanto navega pelo portal.
        </p>
      </div>

      <audio
        ref={audioRef}
        onPlaying={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onError={() => {
          setLoading(false);
          setPlaying(false);
        }}
      />

      <div className="space-y-2">
        {RADIO_STATIONS.map((station) => {
          const active = current?.url === station.url;
          const isPlaying = active && playing;
          const isLoading = active && loading;
          return (
            <button
              key={station.url}
              onClick={() => selectStation(station)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left transition-colors hover:bg-slate-50',
                active
                  ? 'border-indigo-300 ring-1 ring-indigo-200'
                  : 'border-border',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
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
              {isPlaying && <RadioIcon className="h-4 w-4 text-indigo-500" />}
            </button>
          );
        })}
      </div>

      <p className="pt-1 text-center text-xs text-slate-400">
        Transmissões de emissoras externas; podem ficar indisponíveis às vezes.
      </p>
    </div>
  );
}
