import { IsEmail, IsString } from 'class-validator';

export class MemberLoginDto {
  @IsString({ message: 'Identificador da igreja inválido.' })
  slug!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString({ message: 'Informe a senha.' })
  password!: string;
}
