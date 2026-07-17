import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class MemberRegisterDto {
  @IsString({ message: 'Identificador da igreja inválido.' })
  slug!: string;

  @IsString({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'Informe seu nome completo.' })
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Sexo inválido.' })
  gender?: Gender;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefone inválido.' })
  phone?: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres.' })
  @MaxLength(72)
  password!: string;
}
