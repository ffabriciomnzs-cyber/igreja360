// Gera uma imagem quadrada (1080x1080) do versículo para compartilhar nas redes,
// quando o devocional não traz uma imagem própria. Tudo no navegador (sem custo).

interface VerseImageOptions {
  verseText: string;
  verseRef: string;
  title?: string;
  footer?: string;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateVerseImage(
  opts: VerseImageOptions,
): Promise<{ dataUrl: string; blob: Blob | null }> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: '', blob: null };

  // Fundo em degradê índigo.
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#4f46e5');
  bg.addColorStop(1, '#312e81');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Círculos decorativos sutis.
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.arc(size * 0.85, size * 0.14, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.08, size * 0.92, 280, 0, Math.PI * 2);
  ctx.fill();

  const pad = 110;
  const maxWidth = size - pad * 2;
  ctx.textAlign = 'center';

  // Título (opcional).
  if (opts.title) {
    ctx.font = '600 40px Georgia, serif';
    ctx.fillStyle = 'rgba(199,210,254,0.95)';
    ctx.fillText(opts.title.toUpperCase().slice(0, 42), size / 2, 200);
  }

  // Texto do versículo, com fonte ajustada para caber.
  const text = `“${opts.verseText}”`;
  let fontSize = 70;
  let lines: string[] = [];
  const measure = (): number => {
    ctx.font = `600 ${fontSize}px Georgia, serif`;
    lines = wrapLines(ctx, text, maxWidth);
    return lines.length * (fontSize * 1.35);
  };
  while (measure() > size * 0.52 && fontSize > 32) fontSize -= 4;

  const lineHeight = fontSize * 1.35;
  const blockHeight = lines.length * lineHeight;
  let y = (size - blockHeight) / 2 + fontSize * 0.8;
  ctx.fillStyle = '#ffffff';
  for (const line of lines) {
    ctx.fillText(line, size / 2, y);
    y += lineHeight;
  }

  // Referência.
  ctx.font = '700 46px Georgia, serif';
  ctx.fillStyle = 'rgba(199,210,254,0.95)';
  ctx.fillText(opts.verseRef, size / 2, y + 46);

  // Rodapé (nome da igreja / app).
  if (opts.footer) {
    ctx.font = '500 34px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(opts.footer, size / 2, size - 88);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
  );
  return { dataUrl, blob };
}
