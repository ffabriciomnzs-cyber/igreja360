export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: CampaignStatus;
  goal: string | null;
  current: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  CLOSED: 'Encerrada',
};

export const CAMPAIGN_STATUS_VARIANTS: Record<
  CampaignStatus,
  'success' | 'warning' | 'muted'
> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  CLOSED: 'muted',
};

export const CAMPAIGN_TYPES = [
  'Financeira',
  'Arrecadação',
  'Missões',
  'Construção',
  'Social',
  'Outro',
];
