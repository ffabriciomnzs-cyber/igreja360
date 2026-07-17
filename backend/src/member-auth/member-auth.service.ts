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

function onlyDigits(v?: string | null): string {
  return (v ?? '').replace(/\D/g, '');
}

// Chave de comparação de telefone: só dígitos, sem o código do país (55).
// Assim "(21) 97935-8087", "21979358087" e "+5521979358087" batem entre si.
function phoneKey(v?: string | null): string {
  let d = onlyDigits(v);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d;
}

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

  // Dados públicos da igreja para a tela de login (logo/nome).
  async churchInfo(slug: string) {
    const church = await this.prisma.church.findUnique({
      where: { slug: slug.trim() },
      select: { name: true, logo: true, cardLogo: true, denomination: true },
    });
    if (!church) throw new NotFoundException('Igreja não encontrada.');
    return church;
  }

  async register(dto: MemberRegisterDto) {
    const church = await this.churchBySlug(dto.slug.trim());
    const email = dto.email.toLowerCase().trim();
    const phone = dto.phone?.trim() || null;
    const key = phoneKey(phone);

    // 1) Confere por e-mail. 2) Se não achar e houver telefone, confere pelo
    // telefone (normalizado) — evita duplicar quem já foi cadastrado pela igreja.
    let existing = await this.prisma.member.findFirst({
      where: { churchId: church.id, email },
      select: {
        id: true,
        email: true,
        phone: true,
        gender: true,
        passwordHash: true,
      },
    });
    if (!existing && key) {
      const candidates = await this.prisma.member.findMany({
        where: { churchId: church.id, phone: { not: null } },
        select: {
          id: true,
          email: true,
          phone: true,
          gender: true,
          passwordHash: true,
        },
      });
      existing = candidates.find((c) => phoneKey(c.phone) === key) ?? null;
    }

    if (existing) {
      if (existing.passwordHash) {
        throw new BadRequestException(
          'Já existe uma conta com este e-mail ou telefone. Fale com a igreja se esqueceu a senha.',
        );
      }
      // Vincula ao cadastro existente, preenchendo só o que estiver faltando
      // (não sobrescreve dados que a igreja já cadastrou).
      await this.prisma.member.update({
        where: { id: existing.id },
        data: {
          name: dto.name.trim(),
          ...(existing.email ? {} : { email }),
          ...(phone && !existing.phone ? { phone } : {}),
          ...(dto.gender && !existing.gender ? { gender: dto.gender } : {}),
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
          phone,
          gender: dto.gender ?? null,
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
    const identifier = dto.email.trim();

    // Aceita e-mail OU telefone como acesso.
    let member = null;
    if (identifier.includes('@')) {
      member = await this.prisma.member.findFirst({
        where: { churchId: church.id, email: identifier.toLowerCase() },
      });
    } else {
      const key = phoneKey(identifier);
      if (key) {
        const candidates = await this.prisma.member.findMany({
          where: {
            churchId: church.id,
            phone: { not: null },
            passwordHash: { not: null },
          },
        });
        member = candidates.find((c) => phoneKey(c.phone) === key) ?? null;
      }
    }

    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('E-mail/telefone ou senha inválidos.');
    }
    const ok = await bcrypt.compare(dto.password, member.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('E-mail/telefone ou senha inválidos.');
    }

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
