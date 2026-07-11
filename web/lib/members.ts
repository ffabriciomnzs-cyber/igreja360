export type MemberStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'VISITOR'
  | 'TRANSFERRED'
  | 'DECEASED';

export type MemberRole =
  | 'DEACON'
  | 'ELDER'
  | 'EVANGELIST'
  | 'PASTOR'
  | 'WORKER'
  | 'MEMBER';

export type Gender = 'MALE' | 'FEMALE';

export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  gender: Gender | null;
  birthDate: string | null;
  baptismDate: string | null;
  address: string | null;
  city: string | null;
  rg: string | null;
  maritalStatus: string | null;
  profession: string | null;
  photo: string | null;
  status: MemberStatus;
  role: MemberRole | null;
  cellId: string | null;
  cell: { id: string; name: string } | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMembers {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberCardChurch {
  id: string;
  name: string;
  logo: string | null;
  cardLogo: string | null;
  denomination: string | null;
  phone: string | null;
  address: string | null;
}

export interface MemberCardData {
  member: Member;
  church: MemberCardChurch | null;
}

export interface MemberStats {
  total: number;
  active: number;
  visitors: number;
  inactive: number;
  recent: Member[];
}

export interface MemberBirthday {
  id: string;
  name: string;
  birthDate: string;
  status: MemberStatus;
}

export interface MemberGrowthPoint {
  key: string;
  label: string;
  count: number;
}

export const STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  VISITOR: 'Visitante',
  TRANSFERRED: 'Transferido',
  DECEASED: 'Falecido',
};

export const STATUS_VARIANTS: Record<
  MemberStatus,
  'success' | 'muted' | 'warning' | 'default' | 'danger'
> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  VISITOR: 'warning',
  TRANSFERRED: 'default',
  DECEASED: 'danger',
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  DEACON: 'Diácono',
  ELDER: 'Presbítero',
  EVANGELIST: 'Evangelista',
  PASTOR: 'Pastor',
  WORKER: 'Obreiro',
  MEMBER: 'Membro',
};

// Cargos no feminino (usados quando o sexo do membro é feminino).
export const ROLE_LABELS_FEMALE: Record<MemberRole, string> = {
  DEACON: 'Diaconisa',
  ELDER: 'Presbítera',
  EVANGELIST: 'Evangelista',
  PASTOR: 'Pastora',
  WORKER: 'Obreira',
  MEMBER: 'Membro',
};

// Rótulo do cargo já flexionado pelo sexo (feminino quando gender === 'FEMALE').
export function roleLabel(role: MemberRole, gender?: Gender | null): string {
  return gender === 'FEMALE' ? ROLE_LABELS_FEMALE[role] : ROLE_LABELS[role];
}

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
};

export const STATUS_OPTIONS: MemberStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'VISITOR',
  'TRANSFERRED',
  'DECEASED',
];

export const ROLE_OPTIONS: MemberRole[] = [
  'MEMBER',
  'WORKER',
  'DEACON',
  'ELDER',
  'EVANGELIST',
  'PASTOR',
];
