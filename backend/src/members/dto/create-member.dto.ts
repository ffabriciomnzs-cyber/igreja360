import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender, MemberRole, MemberStatus } from '@prisma/client';

export class CreateMemberDto {
  @IsString({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  @MaxLength(120, { message: 'O nome é muito longo.' })
  name!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefone inválido.' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14, { message: 'CPF inválido.' })
  cpf?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de nascimento inválida.' })
  birthDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de batismo inválida.' })
  baptismDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Endereço muito longo.' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Cidade inválida.' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'RG inválido.' })
  rg?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'Estado civil inválido.' })
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Profissão inválida.' })
  profession?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Sexo inválido.' })
  gender?: Gender;

  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Status inválido.' })
  status?: MemberStatus;

  @IsOptional()
  @IsEnum(MemberRole, { message: 'Cargo inválido.' })
  role?: MemberRole;

  @IsOptional()
  @IsString()
  cellId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de entrada inválida.' })
  joinedAt?: string;
}
