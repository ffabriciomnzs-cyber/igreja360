export type WorshipStatus = 'PLANNED' | 'DONE' | 'CANCELED';

export interface WorshipItem {
  id?: string;
  order: number;
  title: string;
  responsible: string | null;
  durationMin: number | null;
  notes: string | null;
}

export interface WorshipParticipant {
  id?: string;
  memberId: string | null;
  name: string;
  role: string;
  notes: string | null;
}

export interface WorshipService {
  id: string;
  title: string;
  date: string;
  theme: string | null;
  bibleRef: string | null;
  notes: string | null;
  status: WorshipStatus;
  items: WorshipItem[];
  participants: WorshipParticipant[];
  _count?: { items: number; participants: number };
  createdAt: string;
  updatedAt: string;
}

export const WORSHIP_STATUS_LABELS: Record<WorshipStatus, string> = {
  PLANNED: 'Planejado',
  DONE: 'Realizado',
  CANCELED: 'Cancelado',
};

export const WORSHIP_STATUS_VARIANTS: Record<
  WorshipStatus,
  'default' | 'success' | 'muted'
> = {
  PLANNED: 'default',
  DONE: 'success',
  CANCELED: 'muted',
};

export const WORSHIP_STATUS_OPTIONS: WorshipStatus[] = [
  'PLANNED',
  'DONE',
  'CANCELED',
];

// Sugestões para a "ordem do culto" (liturgia).
export const WORSHIP_ITEM_SUGGESTIONS = [
  'Abertura / Boas-vindas',
  'Louvor e adoração',
  'Oração',
  'Leitura bíblica',
  'Mensagem / Pregação',
  'Dízimos e ofertas',
  'Santa Ceia',
  'Avisos',
  'Encerramento',
];

// Funções para escalar/convidar participantes.
export const WORSHIP_PARTICIPANT_ROLES = [
  'Pregação',
  'Louvor / Ministração',
  'Oração',
  'Leitura bíblica',
  'Recepção',
  'Dízimos e ofertas',
  'Santa Ceia',
  'Avisos',
  'Sonoplastia',
  'Outro',
];
