'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { RadioStation } from '@/lib/radio';

interface RadioPlayerCtx {
  current: RadioStation | null;
  playing: boolean;
  loading: boolean;
  /** Toca a estação; se for a mesma já ativa, alterna play/pause. */
  select: (station: RadioStation) => void;
  toggle: () => void;
  stop: () => void;
}

const Ctx = createContext<RadioPlayerCtx | null>(null);

// Player de rádio persistente: o <audio> vive aqui (no layout do portal), então
// continua tocando ao navegar entre as telas. Antes ele ficava dentro da página
// Rádio e parava ao trocar de aba.
export function RadioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) audio.pause();
    else void audio.play().catch(() => undefined);
  }, [current, playing]);

  const select = useCallback(
    (station: RadioStation): void => {
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
    },
    [current, playing],
  );

  const stop = useCallback((): void => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setCurrent(null);
    setPlaying(false);
    setLoading(false);
  }, []);

  // Media Session: controles na tela de bloqueio / notificação (ajuda a
  // continuar tocando em segundo plano no celular).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }
    const ms = navigator.mediaSession;
    if (current) {
      try {
        ms.metadata = new MediaMetadata({
          title: current.name,
          artist: 'Rádio Gospel',
          album: 'Igreja360',
        });
      } catch {
        /* ignora */
      }
      ms.playbackState = playing ? 'playing' : 'paused';
      ms.setActionHandler('play', () => toggle());
      ms.setActionHandler('pause', () => toggle());
      ms.setActionHandler('stop', () => stop());
    } else {
      ms.metadata = null;
      ms.playbackState = 'none';
    }
  }, [current, playing, toggle, stop]);

  return (
    <Ctx.Provider value={{ current, playing, loading, select, toggle, stop }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
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
      {children}
    </Ctx.Provider>
  );
}

export function useRadioPlayer(): RadioPlayerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useRadioPlayer deve ser usado dentro do RadioPlayerProvider');
  }
  return ctx;
}
