'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Loader2, Radio } from 'lucide-react';
import { RADIO_STATIONS, RadioStation } from '@/lib/radio';

export function RadioPlayer(): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);

  function startStation(station: RadioStation): void {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrent(station);
    setLoading(true);
    audio.src = station.url;
    audio.volume = volume;
    audio.load();
    void audio.play().catch(() => {
      setLoading(false);
      setPlaying(false);
    });
  }

  function handleSelect(url: string): void {
    const station = RADIO_STATIONS.find((s) => s.url === url);
    const audio = audioRef.current;
    if (!url || !audio) {
      audio?.pause();
      setCurrent(null);
      return;
    }
    if (station) startStation(station);
  }

  function toggle(): void {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) audio.pause();
    else void audio.play().catch(() => undefined);
  }

  function changeVolume(v: number): void {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  return (
    <div className="flex items-center gap-2">
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

      <button
        type="button"
        onClick={toggle}
        disabled={!current}
        title={playing ? 'Pausar' : 'Tocar'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <Radio className="hidden h-4 w-4 text-indigo-500 sm:block" />

      <select
        value={current?.url ?? ''}
        onChange={(e) => handleSelect(e.target.value)}
        title="Escolher rádio gospel"
        className="max-w-[9rem] rounded-md border border-border bg-white px-2 py-1.5 text-sm text-slate-700 sm:max-w-[12rem]"
      >
        <option value="">Rádio gospel…</option>
        {RADIO_STATIONS.map((s) => (
          <option key={s.url} value={s.url}>
            {s.name}
          </option>
        ))}
      </select>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => changeVolume(Number(e.target.value))}
        title="Volume"
        className="hidden w-20 accent-indigo-600 lg:block"
      />
    </div>
  );
}
