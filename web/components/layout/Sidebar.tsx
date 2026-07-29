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

interface NavGroup {
  /** Título da seção; null = itens soltos no topo (Dashboard). */
  title: string | null;
  items: NavItem[];
}

// Agrupado por contexto de uso, não por ordem de criação: a secretária acha
// "Cultos" porque procura em Programação, sem decorar a posição na lista.
const groups: NavGroup[] = [
  {
    title: null,
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Pessoas',
    items: [
      { href: '/members', label: 'Membros', icon: Users },
      { href: '/cells', label: 'Células', icon: Network },
    ],
  },
  {
    title: 'Programação',
    items: [
      { href: '/events', label: 'Eventos', icon: Calendar },
      { href: '/worship', label: 'Cultos', icon: ClipboardList },
    ],
  },
  {
    title: 'Finanças',
    items: [
      { href: '/financial', label: 'Financeiro', icon: Wallet },
      { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
    ],
  },
  {
    title: 'Comunicação',
    items: [
      { href: '/communications', label: 'Comunicações', icon: MessageSquare },
      { href: '/prayers', label: 'Orações', icon: HandHeart },
      { href: '/bible', label: 'Bíblia', icon: BookOpen },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/reports', label: 'Relatórios', icon: FileText },
      { href: '/users', label: 'Usuários', icon: UserCog, adminOnly: true },
      { href: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
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
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          {church?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={church.logo}
              alt="Logo"
              className="h-8 w-8 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Church className="h-5 w-5" />
            </span>
          )}
          <span className="truncate text-base font-bold tracking-tight text-slate-900">
            {church?.name || 'Igreja360'}
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => {
            const visible = group.items.filter(
              (item) => !item.adminOnly || isAdmin,
            );
            if (visible.length === 0) return null;
            return (
              <div key={group.title ?? 'top'} className="mb-1">
                {group.title && (
                  <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {visible.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900',
                            active &&
                              'bg-indigo-50 font-medium text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              active ? 'text-indigo-600' : 'text-slate-400',
                            )}
                          />
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
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
