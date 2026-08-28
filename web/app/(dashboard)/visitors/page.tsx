'use client';

// Fila de visitantes: quem chegou pelo QR code do culto e o acompanhamento
// até virar membro. É a tela que responde "quem apareceu domingo e ninguém
// falou com essa pessoa ainda?".

import { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  QrCode,
  Loader2,
  Phone,
  HandHeart,
  MessageSquarePlus,
  UserCheck,
  Printer,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ListSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Status = 'NEW' | 'CONTACTED' | 'RETURNED' | 'MEMBER' | 'ARCHIVED';

interface FollowUp {
  id: string;
  note: string;
  createdAt: string;
}

interface Visitor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  howFound: string | null;
  invitedBy: string | null;
  prayerRequest: string | null;
  wantsVisit: boolean;
  status: Status;
  memberId: string | null;
  createdAt: string;
  followUps: FollowUp[];
}

interface Stats {
  novos: number;
  contatados: number;
  retornaram: number;
  viraramMembros: number;
  ultimos30Dias: number;
  pediramVisita: number;
}

const ROTULO: Record<Status, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  RETURNED: 'Voltou',
  MEMBER: 'Virou membro',
  ARCHIVED: 'Arquivado',
};

const COR: Record<Status, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
  NEW: 'warning',
  CONTACTED: 'default',
  RETURNED: 'success',
  MEMBER: 'success',
  ARCHIVED: 'muted',
};

const FILTROS: { id: Status | ''; rotulo: string }[] = [
  { id: '', rotulo: 'Todos' },
  { id: 'NEW', rotulo: 'Novos' },
  { id: 'CONTACTED', rotulo: 'Contatados' },
  { id: 'RETURNED', rotulo: 'Voltaram' },
  { id: 'MEMBER', rotulo: 'Viraram membros' },
];

export default function VisitorsPage(): React.ReactElement {
  const [itens, setItens] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filtro, setFiltro] = useState<Status | ''>('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [anotando, setAnotando] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [agindo, setAgindo] = useState<string | null>(null);

  const [qr, setQr] = useState<string | null>(null);
  const [linkQr, setLinkQr] = useState('');

  const carrega = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Visitor[]>(`/visitors${filtro ? `?status=${filtro}` : ''}`),
      api.get<Stats>('/visitors/stats'),
    ])
      .then(([lista, resumo]) => {
        setItens(lista.data);
        setStats(resumo.data);
      })
      .catch((err) => setErro(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [filtro]);

  useEffect(() => {
    carrega();
  }, [carrega]);

  /**
   * Gera o QR do cadastro público a partir do slug da própria igreja.
   * A biblioteca entra por import dinâmico: ela só é baixada por quem
   * realmente abre o QR, e não pesa no carregamento da tela.
   */
  const abreQr = useCallback(async () => {
    try {
      const { data } = await api.get<{ slug: string }>('/settings/church');
      const url = `${window.location.origin}/v/${data.slug}`;
      setLinkQr(url);
      // Caminho do build de NAVEGADOR: o entry padrão do pacote puxa módulos
      // do Node e não resolve dentro do bundle.
      const QRCode = (await import('qrcode/lib/browser')) as unknown as {
        toDataURL: (t: string, o?: Record<string, unknown>) => Promise<string>;
      };
      setQr(await QRCode.toDataURL(url, { width: 720, margin: 1 }));
    } catch (err) {
      console.error('Falha ao gerar o QR code:', err);
      toast.error('Não consegui gerar o QR code. Tente de novo.');
    }
  }, []);

  async function anota(id: string): Promise<void> {
    if (nota.trim().length < 2) return;
    setAgindo(id);
    try {
      const { data } = await api.post<Visitor>(`/visitors/${id}/follow-up`, {
        note: nota.trim(),
      });
      setItens((prev) => prev.map((v) => (v.id === id ? data : v)));
      setNota('');
      setAnotando(null);
      carrega();
      toast.success('Contato registrado.');
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function mudaStatus(id: string, status: Status): Promise<void> {
    setAgindo(id);
    try {
      await api.patch(`/visitors/${id}/status`, { status });
      carrega();
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function converte(v: Visitor): Promise<void> {
    if (
      !window.confirm(
        `Cadastrar ${v.name} como membro da igreja? Os dados do visitante serão copiados para a ficha de membro.`,
      )
    ) {
      return;
    }
    setAgindo(v.id);
    try {
      await api.post(`/visitors/${v.id}/convert`);
      carrega();
      toast.success(`${v.name} agora é membro!`);
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setAgindo(null);
    }
  }

  async function apaga(v: Visitor): Promise<void> {
    if (!window.confirm(`Excluir o registro de ${v.name}?`)) return;
    try {
      await api.delete(`/visitors/${v.id}`);
      carrega();
      toast.success('Registro excluído.');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  function whatsapp(v: Visitor): void {
    if (!v.phone) return;
    let d = v.phone.replace(/\D/g, '');
    if (d.length <= 11) d = `55${d}`;
    const texto = encodeURIComponent(
      `Olá, ${v.name.split(' ')[0]}! Que alegria ter você conosco. Como podemos te servir?`,
    );
    window.open(`https://wa.me/${d}?text=${texto}`, '_blank', 'noopener');
  }

  const cards = [
    { rotulo: 'Novos', valor: stats?.novos ?? 0, cor: 'text-amber-600 dark:text-amber-400' },
    { rotulo: 'Pediram visita', valor: stats?.pediramVisita ?? 0, cor: 'text-red-600 dark:text-red-400' },
    { rotulo: 'Últimos 30 dias', valor: stats?.ultimos30Dias ?? 0, cor: 'text-slate-900 dark:text-slate-100' },
    { rotulo: 'Viraram membros', valor: stats?.viraramMembros ?? 0, cor: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div>
      <PageHeader
        title="Visitantes"
        description="Quem chegou pelo QR code do culto e o acompanhamento de cada um."
        action={
          <Button onClick={abreQr}>
            <QrCode className="h-4 w-4" />
            QR code do culto
          </Button>
        }
      />

      {qr && (
        <Card className="mb-4">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center print:p-0">
            <p className="text-sm text-slate-500 dark:text-slate-400 print:hidden">
              Projete no telão ou imprima e deixe na entrada. Quem ler cai
              direto no formulário de visitante.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code para visitantes" className="h-64 w-64" />
            <code className="text-xs text-slate-500 dark:text-slate-400">{linkQr}</code>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="ghost" onClick={() => setQr(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.rotulo}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.rotulo}</p>
              <p className={`mt-1 text-2xl font-bold ${c.cor}`}>{c.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.id || 'todos'}
            onClick={() => setFiltro(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === f.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {erro}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : itens.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Nenhum visitante ainda"
          description="Projete o QR code no culto para quem chega se cadastrar sozinho, em 30 segundos."
        />
      ) : (
        <div className="space-y-3">
          {itens.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {v.name}
                      </p>
                      <Badge variant={COR[v.status]}>{ROTULO[v.status]}</Badge>
                      {v.wantsVisit && v.status !== 'MEMBER' && (
                        <Badge variant="danger">
                          <HandHeart className="mr-1 inline h-3 w-3" />
                          Pediu visita
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Chegou em {formatDate(v.createdAt)}
                      {v.howFound ? ` · ${v.howFound}` : ''}
                      {v.invitedBy ? ` (convite de ${v.invitedBy})` : ''}
                    </p>
                    {v.phone && (
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                        {v.phone}
                      </p>
                    )}
                    {v.prayerRequest && (
                      <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                        “{v.prayerRequest}”
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {v.phone && (
                      <Button size="sm" variant="outline" onClick={() => whatsapp(v)}>
                        <Phone className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAnotando(anotando === v.id ? null : v.id);
                        setNota('');
                      }}
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                      Registrar contato
                    </Button>
                    {v.status !== 'MEMBER' && (
                      <Button
                        size="sm"
                        onClick={() => converte(v)}
                        disabled={agindo === v.id}
                      >
                        {agindo === v.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                        Virou membro
                      </Button>
                    )}
                  </div>
                </div>

                {anotando === v.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={2}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Liguei e conversamos, vem no domingo…"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => anota(v.id)}
                        disabled={agindo === v.id || nota.trim().length < 2}
                      >
                        Salvar
                      </Button>
                      {v.status !== 'RETURNED' && v.status !== 'MEMBER' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => mudaStatus(v.id, 'RETURNED')}
                        >
                          Marcar que voltou
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => apaga(v)}
                        className="ml-auto text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {v.followUps.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {v.followUps.map((f) => (
                      <p
                        key={f.id}
                        className="text-sm text-slate-500 dark:text-slate-400"
                      >
                        <span className="text-slate-400 dark:text-slate-500">
                          {formatDate(f.createdAt)} ·{' '}
                        </span>
                        {f.note}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
