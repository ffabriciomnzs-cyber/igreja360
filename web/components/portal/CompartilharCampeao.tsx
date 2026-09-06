'use client';

/**
 * Compartilhar o campeão da semana.
 *
 * O destino que a igreja pediu é o STATUS do WhatsApp, e status é imagem — um
 * link de texto (wa.me) abre uma conversa, não o status. Por isso aqui a gente
 * DESENHA um cartaz e entrega o arquivo pronto para a folha de compartilhamento
 * do celular, onde "WhatsApp → Status" é uma das opções.
 *
 * Onde não há folha de compartilhamento (navegador de computador), o cartaz é
 * baixado — a pessoa publica do jeito que quiser.
 */

import { useState } from 'react';
import { Share2, Loader2, Check } from 'lucide-react';
import { memberApi } from '@/lib/member-api';
import type { ArenaChampion } from './ArenaCampeao';

const LARGURA = 1080;
const ALTURA = 1920; // proporção do status

/** Carrega a foto sem "sujar" o canvas; sem CORS, devolve null e usamos iniciais. */
function carregaFoto(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** "31/08 a 06/09" */
function periodo(inicio: string, fim: string): string {
  const curto = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  };
  return `${curto(inicio)} a ${curto(fim)}`;
}

function quebraLinhas(
  ctx: CanvasRenderingContext2D,
  texto: string,
  largura: number,
): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(tentativa).width > largura && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

async function desenhaCartaz(
  champion: ArenaChampion,
  igreja: string,
  convite: string,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fundo
  const fundo = ctx.createLinearGradient(0, 0, LARGURA, ALTURA);
  fundo.addColorStop(0, '#B45309');
  fundo.addColorStop(0.55, '#F59E0B');
  fundo.addColorStop(1, '#CA8A04');
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.textAlign = 'center';

  // Coroa
  ctx.font = '200px serif';
  ctx.fillText('👑', LARGURA / 2, 470);

  // Faixa do título
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(champion.title.toUpperCase(), LARGURA / 2, 585);

  // Foto (ou iniciais) num círculo
  const centroY = 880;
  const raio = 210;
  ctx.save();
  ctx.beginPath();
  ctx.arc(LARGURA / 2, centroY, raio, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const foto = champion.photo ? await carregaFoto(champion.photo) : null;
  if (foto) {
    // Cobre o círculo sem distorcer (recorta o excesso do lado maior).
    const escala = Math.max((raio * 2) / foto.width, (raio * 2) / foto.height);
    const l = foto.width * escala;
    const a = foto.height * escala;
    ctx.drawImage(foto, LARGURA / 2 - l / 2, centroY - a / 2, l, a);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(LARGURA / 2 - raio, centroY - raio, raio * 2, raio * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 150px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(iniciais(champion.name), LARGURA / 2, centroY);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(LARGURA / 2, centroY, raio, 0, Math.PI * 2);
  ctx.stroke();

  // Nome (quebra em duas linhas se for comprido)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 92px system-ui, sans-serif';
  const linhas = quebraLinhas(ctx, champion.name, LARGURA - 140).slice(0, 2);
  let y = 1250;
  for (const linha of linhas) {
    ctx.fillText(linha, LARGURA / 2, y);
    y += 105;
  }

  // Pontos
  ctx.font = 'bold 74px system-ui, sans-serif';
  ctx.fillStyle = '#FFFBEB';
  ctx.fillText(`${champion.points} pontos`, LARGURA / 2, y + 60);

  ctx.font = '46px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('na Arena Bíblica', LARGURA / 2, y + 130);
  ctx.fillText(
    periodo(champion.cycleStart, champion.cycleEnd),
    LARGURA / 2,
    y + 200,
  );

  // Rodapé: a igreja e o convite. O endereço vai IMPRESSO porque muita gente
  // vê só a imagem do status, sem a legenda — sem isto, o convite se perde.
  if (igreja) {
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(igreja, LARGURA / 2, ALTURA - 230);
  }

  ctx.font = '36px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Jogue você também:', LARGURA / 2, ALTURA - 150);

  // Sem o "https://", que só ocupa espaço e ninguém digita.
  const enderecoLimpo = convite.replace(/^https?:\/\//, '');
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  // Encolhe a fonte se o endereço for comprido, para não vazar da imagem.
  let tamanho = 40;
  while (ctx.measureText(enderecoLimpo).width > LARGURA - 100 && tamanho > 22) {
    tamanho -= 2;
    ctx.font = `bold ${tamanho}px system-ui, sans-serif`;
  }
  ctx.fillText(enderecoLimpo, LARGURA / 2, ALTURA - 90);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** O nome da igreja só é buscado no clique: ninguém paga request por um
 *  botão que talvez não use. Se falhar, o cartaz sai sem o rodapé. */
async function nomeDaIgreja(jaSei: string): Promise<string> {
  if (jaSei) return jaSei;
  try {
    const { data } = await memberApi.get<{ church: { name: string } | null }>(
      '/member-auth/me',
    );
    return data.church?.name ?? '';
  } catch {
    return '';
  }
}

export function CompartilharCampeao({
  champion,
  igreja = '',
  base,
}: {
  champion: ArenaChampion;
  igreja?: string;
  /** Caminho do portal desta igreja, ex.: "/portal/judeia". */
  base: string;
}): React.ReactElement {
  const [estado, setEstado] = useState<'parado' | 'gerando' | 'pronto'>(
    'parado',
  );

  async function compartilha(): Promise<void> {
    if (estado === 'gerando') return;
    setEstado('gerando');
    try {
      const nome = await nomeDaIgreja(igreja);
      // O convite é a porta de entrada do portal desta igreja — é lá que a
      // pessoa cria o acesso dela e o painel aprova.
      const convite = `${window.location.origin}${base}`;
      const texto =
        `👑 ${champion.name} — ${champion.title.toLowerCase()} na Arena Bíblica` +
        `${nome ? ` da ${nome}` : ''}, com ${champion.points} pontos!\n\n` +
        `Quer jogar também? Entre pelo portal da igreja: ${convite}`;
      const blob = await desenhaCartaz(champion, nome, convite);
      if (!blob) throw new Error('sem cartaz');
      const arquivo = new File([blob], 'campeao-arena.png', {
        type: 'image/png',
      });

      // Celular: abre a folha de compartilhamento, onde está o Status.
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto });
        setEstado('parado');
        return;
      }

      // Computador: baixa o cartaz para a pessoa publicar por onde quiser.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campeao-arena.png';
      a.click();
      URL.revokeObjectURL(url);
      setEstado('pronto');
      setTimeout(() => setEstado('parado'), 2500);
    } catch {
      // Cancelar o compartilhamento cai aqui e não é erro nenhum.
      setEstado('parado');
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void compartilha();
      }}
      aria-label="Compartilhar o campeão da semana"
      className="pointer-events-auto relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/40"
    >
      {estado === 'gerando' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : estado === 'pronto' ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
}
