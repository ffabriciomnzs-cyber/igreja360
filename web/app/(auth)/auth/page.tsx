'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Church, Users, Wallet, CalendarHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage(): React.ReactElement {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push('/dashboard');
    } else {
      setError(result.error ?? 'Não foi possível entrar.');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-1/2 flex-col justify-between bg-indigo-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Church className="h-7 w-7" />
          Igreja360
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Gestão clara.
            <br />
            Igreja saudável.
          </h1>
          <p className="mt-4 max-w-md text-indigo-100">
            Tudo o que sua igreja precisa em um só lugar: membros, células,
            finanças, eventos e muito mais.
          </p>
          <ul className="mt-8 space-y-4 text-indigo-50">
            <li className="flex items-center gap-3">
              <Users className="h-5 w-5" /> Gestão de membros e células
            </li>
            <li className="flex items-center gap-3">
              <Wallet className="h-5 w-5" /> Controle financeiro completo
            </li>
            <li className="flex items-center gap-3">
              <CalendarHeart className="h-5 w-5" /> Eventos e campanhas
            </li>
          </ul>
        </div>
        <p className="text-sm text-indigo-200">© {new Date().getFullYear()} Igreja360</p>
      </aside>

      <main className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
          <p className="mt-1 text-sm text-slate-500">
            Entre com suas credenciais para acessar o painel.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@suaigreja.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <button
              type="button"
              className="block w-full text-center text-sm text-indigo-600 hover:underline"
            >
              Esqueci minha senha
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
