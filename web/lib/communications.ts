export interface Communication {
  id: string;
  title: string;
  content: string;
  type: string;
  authorId: string | null;
  createdAt: string;
}

export const COMMUNICATION_TYPES = [
  'NOTICE',
  'EVENT',
  'URGENT',
  'DEVOTIONAL',
];

export const COMMUNICATION_TYPE_LABELS: Record<string, string> = {
  NOTICE: 'Aviso',
  EVENT: 'Evento',
  URGENT: 'Urgente',
  DEVOTIONAL: 'Devocional',
};
