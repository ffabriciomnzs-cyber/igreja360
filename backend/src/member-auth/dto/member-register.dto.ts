import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class MemberRegisterDto {
  @IsString({ message: 'Identificador da igreja inválido.' })
  slug!: string;

  @IsString({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'Informe seu nome completo.' })
  @MaxLength(120)
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres.' })
  @MaxLength(72)
  password!: string;
}
