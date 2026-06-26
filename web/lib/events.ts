export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  type: string | null;
  photo: string | null;
  createdAt: string;
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
