import { MemberRole, MemberStatus } from './members';

export interface CellMeeting {
  id: string;
  cellId: string;
  date: string;
  theme: string | null;
  attendees: number | null;
  notes: string | null;
  createdAt: string;
}

export interface CellMember {
  id: string;
  name: string;
  status: MemberStatus;
  role: MemberRole | null;
  photo: string | null;
}

export interface Cell {
  id: string;
  name: string;
  leaderId: string | null;
  coLeaderId: string | null;
  dayOfWeek: string | null;
  time: string | null;
  address: string | null;
  neighborhood: string | null;
  capacity: number | null;
  active: boolean;
  leaderName?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; meetings: number };
}

export interface CellDetail extends Cell {
  coLeaderName: string | null;
  members: CellMember[];
  meetings: CellMeeting[];
}

export interface PaginatedCells {
  data: Cell[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CellStats {
  total: number;
  active: number;
  membersInCells: number;
}

export const DAY_OPTIONS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
