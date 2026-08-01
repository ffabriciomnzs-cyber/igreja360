'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/**
 * Moldura comum dos jogos Kids: voltar + título grandão e colorido.
 * Os jogos rodam 100% no aparelho (sem servidor): simples, rápidos e
 * funcionam mesmo com internet fraca no culto.
 */
export function KidsGameShell({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): React.ReactElement {
  const slug = String(useParams()?.slug ?? '');
  return (
    <div className="space-y-4">
      <Link
        href={`/portal/${slug}/kids`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Kids
      </Link>
      <div className="text-center">
        <p className="text-4xl">{emoji}</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

/** Botão grande e colorido, do tamanho de dedo de criança. */
export function KidsButton({
  onClick,
  children,
  variant = 'primary',
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={
        variant === 'primary'
          ? 'rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-transform active:scale-95'
          : 'rounded-2xl border-2 border-slate-200 px-6 py-3 text-base font-bold text-slate-600 transition-transform active:scale-95 dark:border-slate-700 dark:text-slate-300'
      }
    >
      {children}
    </button>
  );
}
