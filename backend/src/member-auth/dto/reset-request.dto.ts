import { IsString, MaxLength } from 'class-validator';

export class ResetRequestDto {
  @IsString({ message: 'Identificador da igreja inválido.' })
  slug!: string;

  @IsString({ message: 'Informe seu e-mail ou telefone.' })
  @MaxLength(160)
  identifier!: string;
}
