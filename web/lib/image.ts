// Torna transparente o fundo escuro/preto de uma imagem (ideal para logo
// branco sobre fundo preto). Pixels com luminância abaixo do limiar viram
// transparentes.
export async function removeDarkBackground(
  dataUrl: string,
  threshold = 70,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem.'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = image.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        if (lum < threshold) {
          px[i + 3] = 0; // totalmente transparente
        } else if (lum < threshold * 2) {
          // suaviza a borda proporcionalmente
          px[i + 3] = Math.round(((lum - threshold) / threshold) * 255);
        }
      }
      ctx.putImageData(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Imagem inválida.'));
    img.src = dataUrl;
  });
}

/**
 * 'auto'  — PNG entra como PNG (preserva transparência), resto vira JPEG.
 * 'png'   — força PNG. Use em logos, onde a transparência importa.
 * 'jpeg'  — força JPEG **mesmo se o original for PNG**. Use em fotos e
 *           cartazes: um PNG de cartaz sai com centenas de KB, porque PNG não
 *           tem compressão com perda (o `quality` é simplesmente ignorado).
 */
export type ImageFormat = 'auto' | 'png' | 'jpeg';

export async function fileToCompressedDataUrl(
  file: File,
  max = 800,
  quality = 0.8,
  format: ImageFormat = 'auto',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        const comoPng =
          format === 'png' || (format === 'auto' && file.type === 'image/png');

        // JPEG não tem canal alfa: sem isso, o transparente de um PNG
        // convertido sairia preto. Pinta o fundo antes de desenhar.
        if (!comoPng) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = comoPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
