import { Gender, UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  churchId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  gender: Gender | null;
  churchId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}
