'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Users,
  Calendar,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Network,
  CornerDownLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchHit {
  type: 'member' | 'event' | 'worship' | 'campaign' | 'communication' | 'cell';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

const TYPE_META: Record<
  SearchHit['type'],
  { label: string; icon: typeof Users }
> = {
  member: { label: 'Membros', icon: Users },
  event: { label: 'Eventos', icon: Calendar },
  worship: { label: 'Cultos', icon: ClipboardList },
  campaign: { label: 'Campanhas', icon: Megaphone },
  communication: { label: 'Comunicados', icon: MessageSquare },
  cell: { label: 'Células', icon: Network },
};

/**
 * Busca global (⌘K / Ctrl+K): digita e navega para membro, evento, culto,
 * campanha, comunicado ou célula sem passar pelos menus.
 */
export function CommandPalette(): React.ReactElement | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Descarta resposta antiga que chegue depois de uma mais nova (digitação rápida).
  const seqRef = useRef(0);

  // Atalho global. `metaKey` = ⌘ no Mac; `ctrlKey` cobre Windows/Linux.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    const openHandler = (): void => setOpen(true);
    window.addEventListener('igreja360:open-search', openHandler);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('igreja360:open-search', openHandler);
    };
  }, []);

  // Foco ao abrir; limpa ao fechar.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setHits([]);
      setSelected(0);
    }
  }, [open]);

  // Busca com debounce de 250ms.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const seq = ++seqRef.current;
    const timer = setTimeout(() => {
      api
        .get<SearchHit[]>('/search', { params: { q } })
        .then(({ data }) => {
          if (seqRef.current !== seq) return;
          setHits(data);
          setSelected(0);
        })
        .catch(() => undefined)
        .finally(() => {
          if (seqRef.current === seq) setBusy(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  const go = useCallback(
    (hit: SearchHit): void => {
      setOpen(false);
      router.push(hit.href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Busca global"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, hits.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter' && hits[selected]) {
                e.preventDefault();
                go(hits[selected]);
              }
            }}
            placeholder="Buscar membro, evento, culto, campanha..."
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              Digite ao menos 2 letras para buscar.
            </p>
          ) : hits.length === 0 && !busy ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              Nada encontrado para “{query.trim()}”.
            </p>
          ) : (
            hits.map((hit, i) => {
              const meta = TYPE_META[hit.type];
              const Icon = meta.icon;
              const isFirstOfType = i === 0 || hits[i - 1].type !== hit.type;
              return (
                <div key={`${hit.type}-${hit.id}`}>
                  {isFirstOfType && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {meta.label}
                    </p>
                  )}
                  <button
                    onClick={() => go(hit)}
                    onMouseEnter={() => setSelected(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
                      i === selected ? 'bg-indigo-50' : 'hover:bg-slate-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        i === selected
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {hit.title}
                      </span>
                      {hit.subtitle && (
                        <span className="block truncate text-xs text-slate-500">
                          {hit.subtitle}
                        </span>
                      )}
                    </span>
                    {i === selected && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
