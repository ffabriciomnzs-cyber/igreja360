import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender, UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  @MaxLength(120, { message: 'O nome é muito longo.' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres.' })
  @MaxLength(72, { message: 'Senha muito longa.' })
  password!: string;

  @IsEnum(UserRole, { message: 'Papel inválido.' })
  role!: UserRole;

  @IsOptional()
  @IsEnum(Gender, { message: 'Sexo inválido.' })
  gender?: Gender;
}
