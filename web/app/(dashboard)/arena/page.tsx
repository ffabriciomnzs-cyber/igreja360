'use client';

// Painel da Arena: o que a liderança controla sem mexer em código — as opções
// da votação, os desafios surpresa e a missão da semana.

import { useCallback, useEffect, useState } from 'react';
import { Swords, Zap, Vote, Users, Trash2, Loader2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/skeleton';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface Tema {
  id: string;
  nome: string;
  emoji: string;
  acervo: number;
  porDia: number;
}
interface Overview {
  themes: Tema[];
  season: { theme: string; name: string; emoji: string; endDay: string } | null;
  poll: {
    total: number;
    options: { theme: string; name: string; emoji: string; votes: number }[];
  } | null;
  history: {
    seasons: { startDay: string; name: string }[];
    polls: { startDay: string; winnerName: string | null; votes: number }[];
  };
  flashes: {
    id: string;
    startsAt: string;
    windowMin: number;
    questions: number;
    bonus: number;
    _count: { turns: number };
  }[];
  missions: {
    id: string;
    title: string;
    kind: string;
    target: number;
    progress: number;
    startDay: string;
    endDay: string;
  }[];
}

export default function ArenaAdminPage(): React.ReactElement {
  const [dados, setDados] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);

  const [flash, setFlash] = useState({ startsAt: '', windowMin: 10, questions: 5, bonus: 5 });
  const [missao, setMissao] = useState({ title: '', kind: 'CORRECT', target: 500 });

  const carrega = useCallback(() => {
    setLoading(true);
    api
      .get<Overview>('/arena/overview')
      .then(({ data }) => {
        setDados(data);
        setEscolhidos(data.poll?.options.map((o) => o.theme) ?? []);
      })
      .catch((err) => toast.error(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => carrega(), [carrega]);

  async function salvaOpcoes(): Promise<void> {
    setSalvando('poll');
    try {
      await api.put('/arena/poll/options', { themes: escolhidos });
      toast.success('Opções da votação atualizadas.');
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSalvando(null);
    }
  }

  async function criaFlash(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSalvando('flash');
    try {
      await api.post('/arena/flash', {
        ...flash,
        startsAt: flash.startsAt ? new Date(flash.startsAt).toISOString() : undefined,
      });
      toast.success(
        flash.startsAt
          ? 'Desafio surpresa agendado.'
          : 'Desafio surpresa liberado! O aviso sai em até um minuto.',
      );
      setFlash({ startsAt: '', windowMin: 10, questions: 5, bonus: 5 });
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSalvando(null);
    }
  }

  async function criaMissao(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSalvando('missao');
    try {
      await api.post('/arena/missions', missao);
      toast.success('Missão criada.');
      setMissao({ title: '', kind: 'CORRECT', target: 500 });
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSalvando(null);
    }
  }

  async function apaga(tipo: 'flash' | 'missions', id: string): Promise<void> {
    try {
      await api.delete(`/arena/${tipo}/${id}`);
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  function alterna(tema: string): void {
    setEscolhidos((atual) =>
      atual.includes(tema) ? atual.filter((t) => t !== tema) : [...atual, tema],
    );
  }

  return (
    <div>
      <PageHeader
        title="Arena Bíblica"
        description="Temporada, votação do próximo tema, desafios surpresa e a missão da igreja."
      />

      {loading || !dados ? (
        <ListSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Temporada + votação */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Swords className="h-4 w-4 text-indigo-600" />
                  Temporada desta semana
                </h2>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {dados.season ? `${dados.season.emoji} ${dados.season.name}` : '—'}
                </p>
                <p className="text-xs text-slate-500">
                  A temporada vira sozinha no domingo, com o tema mais votado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Vote className="h-4 w-4 text-violet-600" />
                  Opções em votação
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {dados.poll?.total ?? 0} voto(s) até agora. Tirar uma opção apaga
                  os votos dela.
                </p>
                <div className="mt-3 space-y-1.5">
                  {dados.themes.map((t) => {
                    const marcado = escolhidos.includes(t.id);
                    const votos =
                      dados.poll?.options.find((o) => o.theme === t.id)?.votes ?? 0;
                    return (
                      <button
                        key={t.id}
                        onClick={() => alterna(t.id)}
                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
                          marcado
                            ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{t.emoji}</span>
                        <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                          {t.nome}
                        </span>
                        <span className="text-xs text-slate-400">
                          {t.porDia}/dia · {t.acervo}
                        </span>
                        {votos > 0 && <Badge variant="default">{votos}</Badge>}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => void salvaOpcoes()}
                  disabled={salvando === 'poll' || escolhidos.length < 2}
                  className="mt-3 w-full"
                >
                  {salvando === 'poll' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Salvar opções'
                  )}
                </Button>
              </CardContent>
            </Card>

            {dados.history.polls.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Votações anteriores
                  </h2>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {dados.history.polls.map((p) => (
                      <li key={p.startDay}>
                        {p.startDay}: {p.winnerName ?? '—'} ({p.votes} votos)
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Surpresa + missão */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Desafio surpresa
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Todos recebem um aviso no celular. Quem não entrar dentro da
                  janela perde — quem entrou termina com calma.
                </p>
                <form onSubmit={(e) => void criaFlash(e)} className="mt-3 space-y-3">
                  <div>
                    <Label>Quando liberar (vazio = agora)</Label>
                    <Input
                      type="datetime-local"
                      value={flash.startsAt}
                      onChange={(e) => setFlash({ ...flash, startsAt: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Minutos p/ entrar</Label>
                      <Input
                        type="number"
                        min={2}
                        max={60}
                        value={flash.windowMin}
                        onChange={(e) =>
                          setFlash({ ...flash, windowMin: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Perguntas</Label>
                      <Input
                        type="number"
                        min={3}
                        max={10}
                        value={flash.questions}
                        onChange={(e) =>
                          setFlash({ ...flash, questions: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Bônus/acerto</Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={flash.bonus}
                        onChange={(e) =>
                          setFlash({ ...flash, bonus: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={salvando === 'flash'} className="w-full">
                    {salvando === 'flash' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" /> Criar desafio surpresa
                      </>
                    )}
                  </Button>
                </form>

                {dados.flashes.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {dados.flashes.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                      >
                        <span className="flex-1 text-slate-600 dark:text-slate-300">
                          {formatDateTime(f.startsAt)} · {f.questions} perguntas ·{' '}
                          {f._count.turns} participaç(ões)
                        </span>
                        {f._count.turns === 0 && (
                          <button
                            onClick={() => void apaga('flash', f.id)}
                            className="text-slate-400 hover:text-red-600"
                            aria-label="Apagar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Missão da igreja
                </h2>
                <form onSubmit={(e) => void criaMissao(e)} className="mt-3 space-y-3">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={missao.title}
                      onChange={(e) => setMissao({ ...missao, title: e.target.value })}
                      placeholder="Vamos alcançar 1.000 acertos esta semana"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={missao.kind}
                        onChange={(e) => setMissao({ ...missao, kind: e.target.value })}
                      >
                        <option value="CORRECT">Respostas certas</option>
                        <option value="ROUNDS">Arenas concluídas</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Meta</Label>
                      <Input
                        type="number"
                        min={1}
                        value={missao.target}
                        onChange={(e) =>
                          setMissao({ ...missao, target: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={salvando === 'missao'} className="w-full">
                    {salvando === 'missao' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" /> Criar missão da semana
                      </>
                    )}
                  </Button>
                </form>

                {dados.missions.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {dados.missions.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                      >
                        <span className="flex-1 text-slate-600 dark:text-slate-300">
                          {m.title} — {m.progress}/{m.target} ({m.startDay} a {m.endDay})
                        </span>
                        <button
                          onClick={() => void apaga('missions', m.id)}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Apagar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
