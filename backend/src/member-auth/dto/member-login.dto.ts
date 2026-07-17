import { IsString, MinLength } from 'class-validator';

export class MemberLoginDto {
  @IsString({ message: 'Identificador da igreja inválido.' })
  slug!: string;

  // Identificador de acesso: pode ser e-mail OU telefone.
  @IsString({ message: 'Informe seu e-mail ou telefone.' })
  @MinLength(3, { message: 'Informe seu e-mail ou telefone.' })
  email!: string;

  @IsString({ message: 'Informe a senha.' })
  password!: string;
}
