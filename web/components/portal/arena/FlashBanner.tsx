'use client';

// Desafio surpresa: a urgência é o produto, então o contador é o protagonista.
// O prazo de verdade é do servidor; este número é só o espelho dele.

import { useEffect, useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';

export interface Flash {
  id: string;
  bonus: number;
  total: number;
  secondsToEnter: number;
  joined: boolean;
  answered: number;
  done: boolean;
  score: number;
}

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function FlashBanner({
  flash,
  entrando,
  onEntrar,
}: {
  flash: Flash | null;
  entrando: boolean;
  onEntrar: () => void;
}): React.ReactElement | null {
  const [restam, setRestam] = useState(flash?.secondsToEnter ?? 0);

  useEffect(() => {
    setRestam(flash?.secondsToEnter ?? 0);
  }, [flash?.id, flash?.secondsToEnter]);

  useEffect(() => {
    if (restam <= 0) return;
    const t = setTimeout(() => setRestam((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restam]);

  if (!flash) return null;
  if (flash.done) {
    return (
      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        ⚡ Desafio surpresa concluído — você fez {flash.score} pontos de bônus!
      </div>
    );
  }
  // Não entrou e o tempo acabou: nada a oferecer.
  if (!flash.joined && restam <= 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5" />
        <p className="text-sm font-bold uppercase tracking-wide">Desafio surpresa!</p>
      </div>
      <p className="mt-1 text-sm text-amber-50">
        {flash.joined
          ? `Você está dentro. Faltam ${flash.total - flash.answered} perguntas.`
          : `${flash.total} perguntas valendo ${flash.bonus} pontos cada.`}
      </p>
      {!flash.joined && (
        <p className="mt-2 text-2xl font-bold tabular-nums">
          {mmss(restam)}{' '}
          <span className="text-sm font-medium text-amber-100">para entrar</span>
        </p>
      )}
      <button
        onClick={onEntrar}
        disabled={entrando}
        className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-bold text-orange-700 disabled:opacity-60"
      >
        {entrando ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : flash.joined ? (
          'Continuar o desafio'
        ) : (
          'Entrar agora'
        )}
      </button>
    </div>
  );
}
