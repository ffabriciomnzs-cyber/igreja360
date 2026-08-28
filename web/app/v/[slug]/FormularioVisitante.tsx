'use client';

// Formulário do visitante. Curto de propósito: nome obrigatório e o resto
// opcional. Quem está preenchendo isso está em pé, no meio do culto.

import { useState } from 'react';
import { Loader2, CheckCircle2, HandHeart } from 'lucide-react';

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:3000/v1';

const COMO_CHEGOU = [
  'Convite de um amigo',
  'Convite de um familiar',
  'Passei em frente',
  'Redes sociais',
  'Já frequentei antes',
  'Outro',
];

export function FormularioVisitante({
  slug,
  igreja,
}: {
  slug: string;
  igreja: string;
}): React.ReactElement {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    howFound: '',
    invitedBy: '',
    prayerRequest: '',
    wantsVisit: false,
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [pronto, setPronto] = useState('');

  async function envia(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const res = await fetch(`${API}/public/visitors/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          city: form.city.trim() || undefined,
          howFound: form.howFound || undefined,
          invitedBy: form.invitedBy.trim() || undefined,
          prayerRequest: form.prayerRequest.trim() || undefined,
          wantsVisit: form.wantsVisit,
        }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(dados?.message)
          ? dados.message[0]
          : dados?.message;
        throw new Error(msg || 'Não consegui enviar. Tente de novo.');
      }
      setPronto(dados.message ?? `Obrigado! A ${igreja} vai falar com você.`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não consegui enviar.');
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
          Recebemos seus dados!
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {pronto}
        </p>
        {form.wantsVisit && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400">
            <HandHeart className="h-4 w-4" />
            Alguém da liderança vai te procurar.
          </p>
        )}
      </div>
    );
  }

  const campo =
    'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950';

  return (
    <form onSubmit={envia} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Seu nome *
        </label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Como podemos te chamar?"
          className={campo}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          WhatsApp
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="(00) 90000-0000"
          className={campo}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Como você chegou até nós?
        </label>
        <select
          value={form.howFound}
          onChange={(e) => setForm((f) => ({ ...f, howFound: e.target.value }))}
          className={campo}
        >
          <option value="">Prefiro não dizer</option>
          {COMO_CHEGOU.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {form.howFound.startsWith('Convite') && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Quem te convidou?
          </label>
          <input
            value={form.invitedBy}
            onChange={(e) =>
              setForm((f) => ({ ...f, invitedBy: e.target.value }))
            }
            placeholder="Nome de quem te trouxe"
            className={campo}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Podemos orar por algo?
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.prayerRequest}
          onChange={(e) =>
            setForm((f) => ({ ...f, prayerRequest: e.target.value }))
          }
          placeholder="Se quiser, conte o que está no seu coração"
          className={`${campo} resize-y`}
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        <input
          type="checkbox"
          checked={form.wantsVisit}
          onChange={(e) =>
            setForm((f) => ({ ...f, wantsVisit: e.target.checked }))
          }
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Gostaria de receber uma visita ou conversar com um pastor
        </span>
      </label>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-60"
      >
        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar
      </button>
    </form>
  );
}
