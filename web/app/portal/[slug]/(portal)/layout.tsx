'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Baby, Radio, LogOut } from 'lucide-react';
import {
  memberApi,
  getMemberToken,
  getStoredMember,
  clearMemberSession,
} from '@/lib/member-api';
import { cn } from '@/lib/utils';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const slug = String(params.slug);

  const [ready, setReady] = useState(false);
  const [churchName, setChurchName] = useState('');
  const memberName = getStoredMember()?.name ?? '';

  useEffect(() => {
    if (!getMemberToken()) {
      router.replace(`/portal/${slug}`);
      return;
    }
    let mounted = true;
    memberApi
      .get<{ church: { name: string } | null }>('/member-auth/me')
      .then(({ data }) => {
        if (mounted) setChurchName(data.church?.name ?? '');
      })
      .catch(() => {
        clearMemberSession();
        router.replace(`/portal/${slug}`);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [router, slug]);

  function logout(): void {
    clearMemberSession();
    router.replace(`/portal/${slug}`);
  }

  if (!ready) return null;

  const base = `/portal/${slug}`;
  const nav = [
    { href: `${base}/inicio`, label: 'Início', icon: Home },
    { href: `${base}/devocional`, label: 'Devocional', icon: BookOpen },
    { href: `${base}/kids`, label: 'Kids', icon: Baby },
    { href: `${base}/radio`, label: 'Rádio', icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {churchName || 'Portal do Membro'}
          </p>
          {memberName && (
            <p className="truncate text-xs text-slate-500">Olá, {memberName}</p>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-2xl p-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white">
        <div className="mx-auto flex max-w-2xl">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs',
                  active ? 'text-indigo-600' : 'text-slate-400',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
