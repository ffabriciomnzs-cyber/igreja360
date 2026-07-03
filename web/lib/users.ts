export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  gender: 'MALE' | 'FEMALE' | null;
  active: boolean;
  createdAt: string;
}

// Papéis atribuíveis pelo administrador (SUPER_ADMIN é papel de sistema).
export const USER_ROLE_OPTIONS = [
  'ADMIN',
  'PASTOR',
  'SECRETARY',
  'TREASURER',
  'LEADER',
  'MEMBER',
] as const;
