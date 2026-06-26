import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunicationDto {
  @IsString({ message: 'O título é obrigatório.' })
  @MinLength(2, { message: 'Título muito curto.' })
  @MaxLength(160, { message: 'Título muito longo.' })
  title!: string;

  @IsString({ message: 'O conteúdo é obrigatório.' })
  @MinLength(2, { message: 'Conteúdo muito curto.' })
  @MaxLength(4000, { message: 'Conteúdo muito longo.' })
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Tipo inválido.' })
  type?: string;
}
