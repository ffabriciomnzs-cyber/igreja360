'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, BookMarked, Baby, Radio, LogOut, Church } from 'lucide-react';
import {
  memberApi,
  getMemberToken,
  getStoredMember,
  clearMemberSession,
} from '@/lib/member-api';
import { cn } from '@/lib/utils';
import { InstallPrompt } from '@/components/InstallPrompt';
import { RadioPlayerProvider } from '@/components/portal/radio-player';
import { RadioMiniBar } from '@/components/portal/RadioMiniBar';

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
  const [churchLogo, setChurchLogo] = useState('');
  const memberName = getStoredMember()?.name ?? '';
  const firstName = memberName.split(' ')[0];

  useEffect(() => {
    if (!getMemberToken()) {
      router.replace(`/portal/${slug}`);
      return;
    }
    let mounted = true;
    memberApi
      .get<{ church: { name: string; logo: string | null } | null }>(
        '/member-auth/me',
      )
      .then(({ data }) => {
        if (!mounted) return;
        setChurchName(data.church?.name ?? '');
        setChurchLogo(data.church?.logo ?? '');
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
    { href: `${base}/biblia`, label: 'Bíblia', icon: BookMarked },
    { href: `${base}/kids`, label: 'Kids', icon: Baby },
    { href: `${base}/radio`, label: 'Rádio', icon: Radio },
  ];

  return (
    <RadioPlayerProvider>
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/60 pb-28">
      <header className="sticky top-0 z-30 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/40">
            {churchLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={churchLogo}
                alt="Logo"
                className="h-full w-full object-contain p-0.5"
              />
            ) : (
              <Church className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          <Link
            href={`${base}/perfil`}
            className="min-w-0 flex-1 rounded-lg px-1 py-0.5 -mx-1 transition-colors hover:bg-white/10"
          >
            <p className="truncate text-sm font-semibold leading-tight">
              {churchName || 'Portal do Membro'}
            </p>
            {firstName && (
              <p className="truncate text-xs text-indigo-100">
                Olá, {firstName} 👋 · ver perfil
              </p>
            )}
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">{children}</main>

      <InstallPrompt />
      <RadioMiniBar />

      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
        <div className="mx-auto flex max-w-md items-center justify-around rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.15)] backdrop-blur">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                    active
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow'
                      : 'text-slate-400',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-none',
                    active ? 'font-semibold text-indigo-600' : 'text-slate-400',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </RadioPlayerProvider>
  );
}
