'use client';

import { LogOut, Menu } from 'lucide-react';
import { AuthUser, roleLabel } from '@/lib/auth';
import { RadioPlayer } from './RadioPlayer';

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
    <header className="flex items-center gap-2 border-b border-border bg-white px-3 py-3 md:gap-4 md:px-6">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="-ml-1 shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <RadioPlayer />

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">
            {roleLabel(user.role, user.gender)}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {initials}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-red-600 md:px-3"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </header>
  );
}
