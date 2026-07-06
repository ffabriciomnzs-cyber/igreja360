'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Loader2, Radio as RadioIcon } from 'lucide-react';
import { RADIO_STATIONS, RadioStation } from '@/lib/radio';
import { cn } from '@/lib/utils';

function Equalizer(): React.ReactElement {
  return (
    <div className="flex h-5 items-end gap-0.5">
      <style>{`@keyframes eqbar{0%,100%{height:25%}50%{height:100%}}`}</style>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-white"
          style={{
            height: '100%',
            animation: 'eqbar 0.9s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

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

  function toggleCurrent(): void {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) audio.pause();
    else void audio.play().catch(() => undefined);
  }

  return (
    <div className="space-y-5">
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

      {/* Tocando agora */}
      {current && (
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg">
          <button
            onClick={toggleCurrent}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-indigo-700 shadow-md transition-transform hover:scale-105"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : playing ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 translate-x-0.5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-indigo-200">
              {playing ? 'Tocando agora' : loading ? 'Conectando...' : 'Pausado'}
            </p>
            <p className="truncate text-lg font-bold">{current.name}</p>
            <p className="truncate text-xs text-indigo-200">
              {current.description}
            </p>
          </div>
          {playing && <Equalizer />}
        </div>
      )}

      <div className="space-y-2.5">
        {RADIO_STATIONS.map((station) => {
          const active = current?.url === station.url;
          const isPlaying = active && playing;
          const isLoading = active && loading;
          return (
            <button
              key={station.url}
              onClick={() => selectStation(station)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                active
                  ? 'border-indigo-300 ring-1 ring-indigo-200'
                  : 'border-border',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                  active
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow'
                    : 'bg-indigo-50 text-indigo-600',
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 translate-x-0.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {station.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {station.description}
                </p>
              </div>
              {isPlaying && (
                <RadioIcon className="h-4 w-4 shrink-0 text-indigo-500" />
              )}
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
