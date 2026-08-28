import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VisitorStatus } from '@prisma/client';

/**
 * Cadastro feito pelo PRÓPRIO visitante, num celular, em pé, no meio do
 * culto. Só o nome é obrigatório: cada campo a mais é uma desistência.
 */
export class CreateVisitorDto {
  @IsString({ message: 'Informe seu nome.' })
  @Matches(/^[^@]*$/, { message: 'O campo nome não pode conter um e-mail.' })
  @MinLength(2, { message: 'Informe seu nome.' })
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'Telefone inválido.' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de nascimento inválida.' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  howFound?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  invitedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  prayerRequest?: string;

  @IsOptional()
  @IsBoolean()
  wantsVisit?: boolean;
}

export class UpdateVisitorStatusDto {
  @IsEnum(VisitorStatus, { message: 'Situação inválida.' })
  status!: VisitorStatus;
}

export class FollowUpDto {
  @IsString()
  @MinLength(2, { message: 'Escreva o que foi feito.' })
  @MaxLength(500)
  note!: string;
}
