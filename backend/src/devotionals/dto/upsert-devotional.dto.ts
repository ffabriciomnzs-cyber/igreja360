import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertDevotionalDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida (use AAAA-MM-DD).' })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  verseRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  verseText?: string;

  @IsString({ message: 'A reflexão é obrigatória.' })
  @MinLength(2, { message: 'Escreva a reflexão do dia.' })
  @MaxLength(8000)
  reflection!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  songTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  songUrl?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
