import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';

export interface MemberPrincipal {
  id: string;
  churchId: string;
}

@Injectable()
export class MemberJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { member?: MemberPrincipal }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    const token = header.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        churchId: string;
        type: string;
      }>(token, { secret: this.config.getOrThrow<string>('JWT_SECRET') });
      if (payload.type !== 'member') {
        throw new UnauthorizedException('Sessão inválida.');
      }
      req.member = { id: payload.sub, churchId: payload.churchId };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
  }
}
