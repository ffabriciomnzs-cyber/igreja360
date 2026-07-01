'use client';

import { LogOut } from 'lucide-react';
import { AuthUser, ROLE_LABELS } from '@/lib/auth';
import { RadioPlayer } from './RadioPlayer';

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps): React.ReactElement {
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-white px-6 py-3">
      <RadioPlayer />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </header>
  );
}
