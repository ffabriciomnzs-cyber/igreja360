// Gera uma imagem quadrada (1080x1080) do versículo para compartilhar nas redes,
// quando o devocional não traz uma imagem própria. Tudo no navegador (sem custo).
// Vários temas de cor + decorações, escolhidos por uma "semente" (ex.: o dia),
// para que a arte varie e fique mais criativa.

interface VerseImageOptions {
  verseText: string;
  verseRef: string;
  title?: string;
  footer?: string;
  seed?: number;
}

interface Theme {
  from: string;
  to: string;
  accent: string;
}

const THEMES: Theme[] = [
  { from: '#4f46e5', to: '#312e81', accent: '#c7d2fe' }, // índigo
  { from: '#0d9488', to: '#134e4a', accent: '#99f6e4' }, // teal
  { from: '#f97316', to: '#9f1239', accent: '#fed7aa' }, // pôr do sol
  { from: '#2563eb', to: '#0f172a', accent: '#93c5fd' }, // noite
  { from: '#7c3aed', to: '#4c1d95', accent: '#ddd6fe' }, // violeta
  { from: '#e11d48', to: '#831843', accent: '#fecdd3' }, // rosé
  { from: '#059669', to: '#064e3b', accent: '#a7f3d0' }, // esmeralda
  { from: '#0891b2', to: '#1e3a8a', accent: '#a5f3fc' }, // oceano
  { from: '#d97706', to: '#7c2d12', accent: '#fde68a' }, // âmbar
  { from: '#db2777', to: '#581c87', accent: '#fbcfe8' }, // magenta
];

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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

function drawDecoration(
  ctx: CanvasRenderingContext2D,
  size: number,
  variant: number,
  accent: string,
): void {
  ctx.save();
  const white = 'rgba(255,255,255,';
  switch (variant) {
    case 0: {
      // Bolhas nos cantos.
      ctx.fillStyle = `${white}0.07)`;
      ctx.beginPath();
      ctx.arc(size * 0.86, size * 0.13, 240, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hexToRgba(accent, 0.1);
      ctx.beginPath();
      ctx.arc(size * 0.08, size * 0.92, 300, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 1: {
      // Raios de luz saindo do canto superior direito.
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 === 0 ? `${white}0.05)` : hexToRgba(accent, 0.05);
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(size - 200 - i * 130, size);
        ctx.lineTo(size - 320 - i * 130, size);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 2: {
      // Grade de pontos.
      ctx.fillStyle = `${white}0.09)`;
      for (let x = 70; x < size; x += 62) {
        for (let y = 70; y < size; y += 62) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 3: {
      // Ondas curvas na base.
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle =
          i % 2 === 0 ? `${white}0.06)` : hexToRgba(accent, 0.08);
        ctx.beginPath();
        const base = size - 120 + i * 60;
        ctx.moveTo(0, base);
        ctx.bezierCurveTo(
          size * 0.3,
          base - 120,
          size * 0.7,
          base + 120,
          size,
          base - 40,
        );
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    default: {
      // Moldura fina com marcas nos cantos.
      ctx.strokeStyle = hexToRgba(accent, 0.5);
      ctx.lineWidth = 3;
      ctx.strokeRect(56, 56, size - 112, size - 112);
      ctx.lineWidth = 6;
      ctx.strokeStyle = hexToRgba(accent, 0.85);
      const c = 44;
      const p = 56;
      // cantos
      ctx.beginPath();
      ctx.moveTo(p, p + c);
      ctx.lineTo(p, p);
      ctx.lineTo(p + c, p);
      ctx.moveTo(size - p - c, p);
      ctx.lineTo(size - p, p);
      ctx.lineTo(size - p, p + c);
      ctx.moveTo(size - p, size - p - c);
      ctx.lineTo(size - p, size - p);
      ctx.lineTo(size - p - c, size - p);
      ctx.moveTo(p + c, size - p);
      ctx.lineTo(p, size - p);
      ctx.lineTo(p, size - p - c);
      ctx.stroke();
    }
  }
  ctx.restore();
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

  const seed = Math.abs(Math.floor(opts.seed ?? Date.now() / 8.64e7));
  const theme = THEMES[seed % THEMES.length];
  const deco = seed % 5;
  const dir = seed % 3;

  // Fundo em degradê (direção varia conforme a semente).
  let bg: CanvasGradient;
  if (dir === 0) {
    bg = ctx.createLinearGradient(0, 0, size, size);
  } else if (dir === 1) {
    bg = ctx.createLinearGradient(0, 0, 0, size);
  } else {
    bg = ctx.createRadialGradient(
      size / 2,
      size * 0.38,
      80,
      size / 2,
      size / 2,
      size,
    );
  }
  bg.addColorStop(0, theme.from);
  bg.addColorStop(1, theme.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  drawDecoration(ctx, size, deco, theme.accent);

  // Aspas decorativas grandes ao fundo.
  ctx.textAlign = 'left';
  ctx.fillStyle = hexToRgba(theme.accent, 0.16);
  ctx.font = '700 240px Georgia, serif';
  ctx.fillText('“', 70, 300);

  ctx.textAlign = 'center';

  // Título (opcional).
  if (opts.title) {
    ctx.font = '600 40px Georgia, serif';
    ctx.fillStyle = hexToRgba(theme.accent, 0.95);
    ctx.fillText(opts.title.toUpperCase().slice(0, 42), size / 2, 220);
  }

  // Texto do versículo, com fonte ajustada para caber.
  const text = `“${opts.verseText}”`;
  let fontSize = 70;
  let lines: string[] = [];
  const measure = (): number => {
    ctx.font = `600 ${fontSize}px Georgia, serif`;
    lines = wrapLines(ctx, text, size - 220);
    return lines.length * (fontSize * 1.35);
  };
  while (measure() > size * 0.5 && fontSize > 30) fontSize -= 4;

  const lineHeight = fontSize * 1.35;
  const blockHeight = lines.length * lineHeight;
  let y = (size - blockHeight) / 2 + fontSize * 0.8;
  ctx.fillStyle = '#ffffff';
  for (const line of lines) {
    ctx.fillText(line, size / 2, y);
    y += lineHeight;
  }

  // Linha divisória curta.
  ctx.strokeStyle = hexToRgba(theme.accent, 0.7);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size / 2 - 60, y + 6);
  ctx.lineTo(size / 2 + 60, y + 6);
  ctx.stroke();

  // Referência.
  ctx.font = '700 46px Georgia, serif';
  ctx.fillStyle = hexToRgba(theme.accent, 0.95);
  ctx.fillText(opts.verseRef, size / 2, y + 66);

  // Rodapé (nome da igreja / app).
  if (opts.footer) {
    ctx.font = '500 32px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(`✦  ${opts.footer}`, size / 2, size - 84);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
  );
  return { dataUrl, blob };
}
