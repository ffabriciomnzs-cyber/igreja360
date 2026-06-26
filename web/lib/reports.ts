import type { MemberStatus, MemberRole } from './members';
import type { CampaignStatus } from './campaigns';
import type { PrayerStatus } from './prayers';

export interface ReportCategory {
  category: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

export interface ReportMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: MemberStatus;
  role: MemberRole | null;
  cell: string | null;
  joinedAt: string | null;
  birthDate: string | null;
  baptismDate: string | null;
}

export interface ReportBirthday {
  id: string;
  name: string;
  phone: string | null;
  date: string;
}

export interface ReportNewMembers {
  total: number;
  monthly: { key: string; label: string; count: number }[];
  members: {
    id: string;
    name: string;
    status: MemberStatus;
    cell: string | null;
    joinedAt: string;
  }[];
}

export interface ReportMembersByCell {
  cells: { id: string; name: string; active: boolean; count: number }[];
  withoutCell: number;
}

export interface ReportInactiveMember {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  cell: string | null;
  joinedAt: string | null;
}

export interface ReportCityRow {
  city: string;
  count: number;
}

export interface ReportFinancialTransaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string | null;
  amount: number;
}

export interface ReportFinancial {
  summary: { income: number; expense: number; balance: number };
  byCategory: ReportCategory[];
  transactions: ReportFinancialTransaction[];
}

export interface ReportCashflowPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ReportCell {
  id: string;
  name: string;
  active: boolean;
  dayOfWeek: string | null;
  time: string | null;
  neighborhood: string | null;
  memberCount: number;
  meetingCount: number;
}

export interface ReportEvent {
  id: string;
  name: string;
  date: string;
  type: string | null;
  location: string | null;
  capacity: number | null;
}

export interface ReportCampaign {
  id: string;
  title: string;
  type: string;
  status: CampaignStatus;
  goal: number;
  current: number;
  progress: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ReportPrayers {
  counts: { active: number; answered: number; archived: number };
  prayers: {
    id: string;
    title: string;
    status: PrayerStatus;
    createdAt: string;
  }[];
}

export interface ReportOverview {
  members: {
    total: number;
    active: number;
    visitors: number;
    inactive: number;
  };
  cells: { total: number; active: number; membersInCells: number };
  financial: {
    income: number;
    expense: number;
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthBalance: number;
  };
  events: { upcoming: number };
  campaigns: { active: number };
  prayers: { active: number; answered: number };
  categories: ReportCategory[];
}
