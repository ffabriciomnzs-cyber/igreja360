import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SuggestWorshipDto {
  @IsString({ message: 'O título é obrigatório.' })
  @MinLength(2, { message: 'Informe um título para gerar sugestões.' })
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  theme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  bibleRef?: string;
}
