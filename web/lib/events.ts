import { apiBaseUrl } from './api';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  type: string | null;
  /**
   * Caminho da imagem na API (ex.: `/public/events/abc/photo?v=123`), ou null.
   * A API não devolve mais o base64 do banner: a imagem vem por esta URL, que
   * o navegador guarda em cache. Use `eventPhotoSrc()` para montar o endereço.
   */
  photoUrl: string | null;
  createdAt: string;
}

/**
 * Endereço do banner, para usar em `<img src>`.
 *
 * Aceita as DUAS formas de resposta: a atual (`photoUrl`) e a antiga
 * (`photo` em base64). Motivo: API e portal são serviços separados no Railway
 * e sobem em momentos diferentes — durante essa janela, um pode estar numa
 * versão e o outro na anterior. Tolerar as duas evita banner sumido no meio de
 * um deploy.
 */
export function eventPhotoSrc(event: {
  photoUrl?: string | null;
  photo?: string | null;
}): string | null {
  if (event.photoUrl) return `${apiBaseUrl}${event.photoUrl}`;
  return event.photo || null;
}

export interface PaginatedEvents {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventStats {
  total: number;
  upcoming: number;
}

export const EVENT_TYPES = [
  'Culto',
  'Conferência',
  'Retiro',
  'Reunião',
  'Vigília',
  'Batismo',
  'Casamento',
  'Evangelismo',
  'Outro',
];
