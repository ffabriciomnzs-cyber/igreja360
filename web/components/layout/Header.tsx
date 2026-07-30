'use client';

import { LogOut, Menu, Search } from 'lucide-react';
import { AuthUser, roleLabel } from '@/lib/auth';
import { RadioPlayer } from './RadioPlayer';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
  onMenuClick?: () => void;
}

export function Header({
  user,
  onLogout,
  onMenuClick,
}: HeaderProps): React.ReactElement {
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center gap-2 border-b border-border bg-white dark:bg-slate-900 px-3 py-3 md:gap-4 md:px-6">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="-ml-1 shrink-0 rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <RadioPlayer />

      {/* Abre a busca global (a paleta escuta este evento e o ⌘K/Ctrl+K). */}
      <button
        onClick={() =>
          window.dispatchEvent(new Event('igreja360:open-search'))
        }
        className="flex min-w-0 shrink items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 transition-colors hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 md:w-64"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden truncate md:inline">Buscar...</span>
        <kbd className="ml-auto hidden rounded border border-slate-200 dark:border-slate-800 px-1.5 text-[10px] font-medium md:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5 md:gap-3">
        <ThemeToggle />
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {roleLabel(user.role, user.gender)}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {initials}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 md:px-3"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </header>
  );
}
