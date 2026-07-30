'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_KEY = 'igreja360.theme';

/**
 * Alterna claro/escuro. O padrão (sem escolha salva) segue o sistema — quem
 * clica passa a ter preferência explícita, que vale em todos os acessos.
 * O script no app/layout.tsx aplica a escolha antes da primeira pintura.
 */
export function ThemeToggle({
  className,
}: {
  className?: string;
}): React.ReactElement | null {
  // null até montar: o servidor não sabe o tema, então nem renderiza o ícone
  // (evita ícone errado piscando na hidratação).
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle(): void {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      /* ignora */
    }
    setDark(next);
  }

  if (dark === null) return null;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={dark ? 'Tema claro' : 'Tema escuro'}
      className={cn(
        'rounded-lg p-2 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        className,
      )}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
