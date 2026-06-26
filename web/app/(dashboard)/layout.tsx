'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement | null {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header user={user} onLogout={logout} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
