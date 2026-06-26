'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
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
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-64 flex-col bg-blue-100 text-blue-900">
      <div className="flex items-center gap-2 px-6 py-5 text-xl font-bold">
        <Church className="h-6 w-6 text-blue-600" />
        Igreja360
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-blue-900/60 transition-colors hover:bg-blue-200 hover:text-blue-900',
                  active &&
                    'border-blue-600 bg-blue-200 font-medium text-blue-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
