import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRegisterDto } from './dto/member-register.dto';
import { MemberLoginDto } from './dto/member-login.dto';

@Injectable()
export class MemberAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async churchBySlug(slug: string) {
    const church = await this.prisma.church.findUnique({ where: { slug } });
    if (!church) throw new NotFoundException('Igreja não encontrada.');
    return church;
  }

  async register(dto: MemberRegisterDto) {
    const church = await this.churchBySlug(dto.slug.trim());
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.member.findFirst({
      where: { churchId: church.id, email },
    });

    if (existing) {
      if (existing.passwordHash) {
        throw new BadRequestException(
          'Já existe uma conta com este e-mail. Fale com a igreja se esqueceu a senha.',
        );
      }
      await this.prisma.member.update({
        where: { id: existing.id },
        data: {
          name: dto.name.trim(),
          passwordHash: await bcrypt.hash(dto.password, 10),
          portalStatus: 'PENDING',
        },
      });
    } else {
      await this.prisma.member.create({
        data: {
          churchId: church.id,
          name: dto.name.trim(),
          email,
          status: 'VISITOR',
          passwordHash: await bcrypt.hash(dto.password, 10),
          portalStatus: 'PENDING',
          joinedAt: new Date(),
        },
      });
    }

    return {
      status: 'pending',
      message:
        'Cadastro enviado! Seu acesso será liberado após a aprovação da igreja.',
    };
  }

  async login(dto: MemberLoginDto) {
    const church = await this.churchBySlug(dto.slug.trim());
    const email = dto.email.toLowerCase().trim();

    const member = await this.prisma.member.findFirst({
      where: { churchId: church.id, email },
    });
    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    const ok = await bcrypt.compare(dto.password, member.passwordHash);
    if (!ok) throw new UnauthorizedException('E-mail ou senha inválidos.');

    if (member.portalStatus === 'PENDING') {
      throw new ForbiddenException(
        'Seu acesso está aguardando aprovação da igreja.',
      );
    }
    if (member.portalStatus !== 'APPROVED') {
      throw new ForbiddenException('Seu acesso ao portal não está liberado.');
    }

    const accessToken = await this.jwt.signAsync(
      { sub: member.id, churchId: member.churchId, type: 'member' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '30d',
      },
    );

    return {
      accessToken,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        churchId: member.churchId,
      },
    };
  }
}
