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

/** Endereço completo do banner, para usar em `<img src>`. */
export function eventPhotoSrc(event: {
  photoUrl?: string | null;
}): string | null {
  return event.photoUrl ? `${apiBaseUrl}${event.photoUrl}` : null;
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
