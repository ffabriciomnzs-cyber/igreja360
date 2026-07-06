'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { ChurchSettings } from '@/lib/settings';
import { getStoredUser } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  Network,
  Wallet,
  Calendar,
  Megaphone,
  MessageSquare,
  HandHeart,
  FileText,
  Settings,
  Church,
  BookOpen,
  ClipboardList,
  UserCog,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR'];
const REQUEST_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR', 'SECRETARY'];

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Membros', icon: Users },
  { href: '/cells', label: 'Células', icon: Network },
  { href: '/financial', label: 'Financeiro', icon: Wallet },
  { href: '/events', label: 'Eventos', icon: Calendar },
  { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
  { href: '/communications', label: 'Comunicações', icon: MessageSquare },
  { href: '/prayers', label: 'Orações', icon: HandHeart },
  { href: '/worship', label: 'Cultos', icon: ClipboardList },
  { href: '/bible', label: 'Bíblia', icon: BookOpen },
  { href: '/reports', label: 'Relatórios', icon: FileText },
  { href: '/users', label: 'Usuários', icon: UserCog, adminOnly: true },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  open = false,
  onClose,
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const [church, setChurch] = useState<ChurchSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const role = getStoredUser()?.role ?? '';
    setIsAdmin(ADMIN_ROLES.includes(role));
  }, []);

  // Contador de solicitações de acesso ao portal (badge no item Membros).
  useEffect(() => {
    const role = getStoredUser()?.role ?? '';
    if (!REQUEST_ROLES.includes(role)) return;
    let mounted = true;
    const load = () =>
      api
        .get<unknown[]>('/members/portal/pending')
        .then(({ data }) => {
          if (mounted) setPendingRequests(Array.isArray(data) ? data.length : 0);
        })
        .catch(() => undefined);
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('igreja360:portal-requests-updated', load);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('igreja360:portal-requests-updated', load);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = () =>
      api
        .get<ChurchSettings>('/settings/church')
        .then(({ data }) => {
          if (mounted) setChurch(data);
        })
        .catch(() => undefined);
    load();
    // Recarrega quando a igreja é atualizada nas Configurações.
    window.addEventListener('igreja360:church-updated', load);
    return () => {
      mounted = false;
      window.removeEventListener('igreja360:church-updated', load);
    };
  }, []);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          aria-hidden
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
        />
      )}
      <nav
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-blue-100 text-blue-900 shadow-xl transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 px-6 py-5 text-xl font-bold">
          {church?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logo}
              alt="Logo"
              className="h-8 w-8 shrink-0 rounded object-contain"
            />
          ) : (
            <Church className="h-6 w-6 shrink-0 text-blue-600" />
          )}
          <span className="truncate">{church?.name || 'Igreja360'}</span>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-auto rounded-md p-1.5 text-blue-900/60 hover:bg-blue-200 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      <ul className="flex-1 space-y-1 px-3">
        {items
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-blue-900/60 transition-colors hover:bg-blue-200 hover:text-blue-900',
                  active &&
                    'border-blue-600 bg-blue-200 font-medium text-blue-900',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.href === '/members' && pendingRequests > 0 && (
                  <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {pendingRequests}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
