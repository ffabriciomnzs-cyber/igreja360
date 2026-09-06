'use client';

// Faixa do campeão da semana na tela inicial: foto, nome e coroa.
// Sai sempre do ciclo JÁ ENCERRADO (sábado a sábado), então fica estável do
// domingo até o sábado seguinte — não muda a cada resposta da semana em curso.

import Link from 'next/link';
import { Crown, ChevronRight } from 'lucide-react';
import { CompartilharCampeao } from './CompartilharCampeao';

export interface ArenaChampion {
  memberId: string;
  name: string;
  photo: string | null;
  title: string;
  points: number;
  cycleStart: string;
  cycleEnd: string;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function ArenaCampeao({
  champion,
  base,
  churchName = '',
}: {
  champion: ArenaChampion | null;
  base: string;
  churchName?: string;
}): React.ReactElement | null {
  if (!champion) return null;

  // O card inteiro leva à Arena, mas o botão de compartilhar precisa ser um
  // <button> de verdade — e botão dentro de <a> é HTML inválido. Por isso o
  // link é uma camada esticada por baixo, e não o pai de tudo.
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 p-4 text-white shadow-lg">
      <Link
        href={`${base}/arena`}
        aria-label="Ver a Arena Bíblica"
        className="absolute inset-0 z-0"
      />
      <Crown className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 text-white/15" />

      <div className="pointer-events-none relative z-10 shrink-0">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/25 text-lg font-bold ring-4 ring-white/40">
          {champion.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={champion.photo}
              alt={champion.name}
              className="h-full w-full object-cover"
            />
          ) : (
            iniciais(champion.name)
          )}
        </div>
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl drop-shadow">
          👑
        </span>
      </div>

      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-100">
          {champion.title}
        </p>
        <p className="truncate text-lg font-bold leading-tight">
          {champion.name}
        </p>
        <p className="text-sm text-amber-100">
          {champion.points} pontos na Arena Bíblica
        </p>
      </div>

      <CompartilharCampeao
        champion={champion}
        igreja={churchName}
        base={base}
      />
      <ChevronRight className="pointer-events-none relative z-10 h-5 w-5 shrink-0 text-white/70" />
    </div>
  );
}
