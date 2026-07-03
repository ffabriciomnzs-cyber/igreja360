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

export async function fileToCompressedDataUrl(
  file: File,
  max = 800,
  quality = 0.8,
  // Força saída PNG (mantém transparência) — use para logos.
  png = false,
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
        ctx.drawImage(img, 0, 0, w, h);
        // PNG preserva transparência (logos); demais formatos viram JPEG
        // comprimido (fotos). Sem isso, o fundo transparente ficaria preto.
        const dataUrl =
          png || file.type === 'image/png'
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
