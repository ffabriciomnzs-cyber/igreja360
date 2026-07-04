'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Church, CheckCircle2 } from 'lucide-react';
import {
  memberApi,
  memberApiError,
  saveMemberSession,
  PortalMember,
} from '@/lib/member-api';
import { PORTAL_BG_VIDEO } from '@/lib/portal-config';

type Tab = 'login' | 'register';

export default function PortalLoginPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug);

  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);

  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ name: '', email: '', password: '' });

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await memberApi.post<{
        accessToken: string;
        member: PortalMember;
      }>('/member-auth/login', {
        slug,
        email: login.email.trim(),
        password: login.password,
      });
      saveMemberSession(data.accessToken, data.member);
      router.push(`/portal/${slug}/inicio`);
    } catch (err) {
      setError(memberApiError(err));
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setPendingMsg(null);
    if (reg.password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await memberApi.post<{ message: string }>(
        '/member-auth/register',
        {
          slug,
          name: reg.name.trim(),
          email: reg.email.trim(),
          password: reg.password,
        },
      );
      setPendingMsg(data.message);
      setReg({ name: '', email: '', password: '' });
    } catch (err) {
      setError(memberApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black px-4 py-10">
      {/* Fundo em vídeo (se configurado) */}
      {PORTAL_BG_VIDEO && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={PORTAL_BG_VIDEO}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {/* Brilho suave + camada escura */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.25),_transparent_60%)]" />
      <div className="absolute inset-0 bg-black/60" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Church className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Portal do Membro</h1>
          <p className="mt-1 text-sm text-white/70">
            Acompanhe cultos, eventos e campanhas da sua igreja.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
                setPendingMsg(null);
              }}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
                setPendingMsg(null);
              }}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Criar conta
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {pendingMsg ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-3 font-medium text-slate-900">
                Cadastro enviado!
              </p>
              <p className="mt-1 text-sm text-slate-500">{pendingMsg}</p>
              <button
                onClick={() => {
                  setPendingMsg(null);
                  setTab('login');
                }}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Voltar para entrar
              </button>
            </div>
          ) : tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={login.email}
                  onChange={(e) =>
                    setLogin((s) => ({ ...s, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={login.password}
                  onChange={(e) =>
                    setLogin((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={reg.name}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, name: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={reg.email}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={reg.password}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <p className="text-xs text-slate-400">
                Após o cadastro, seu acesso será liberado pela igreja.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar conta
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
