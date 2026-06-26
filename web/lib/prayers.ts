export type PrayerStatus = 'ACTIVE' | 'ANSWERED' | 'ARCHIVED';

export interface Prayer {
  id: string;
  title: string;
  description: string | null;
  memberId: string | null;
  status: PrayerStatus;
  visibility: string;
  createdAt: string;
}

export const PRAYER_STATUS_LABELS: Record<PrayerStatus, string> = {
  ACTIVE: 'Em oração',
  ANSWERED: 'Respondido',
  ARCHIVED: 'Arquivado',
};

export const PRAYER_STATUS_VARIANTS: Record<
  PrayerStatus,
  'default' | 'success' | 'muted'
> = {
  ACTIVE: 'default',
  ANSWERED: 'success',
  ARCHIVED: 'muted',
};
