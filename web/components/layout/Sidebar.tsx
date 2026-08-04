'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { ChurchSettings } from '@/lib/settings';
import { getStoredUser } from '@/lib/auth';
import { usePortalRequests } from '@/lib/use-portal-requests';
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
  PlayCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PASTOR'];

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
      { href: '/ajuda', label: 'Ajuda em vídeo', icon: PlayCircle },
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
  // Badge no item Membros: cadastros aguardando liberação + pedidos de senha.
  const { total: pendingRequests } = usePortalRequests();

  useEffect(() => {
    const role = getStoredUser()?.role ?? '';
    setIsAdmin(ADMIN_ROLES.includes(role));
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
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:shadow-none',
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
          <span className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {church?.name || 'Igreja360'}
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-auto rounded-md p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 md:hidden"
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
                  <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                            active &&
                              'bg-indigo-50 dark:bg-indigo-950/50 font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500',
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
