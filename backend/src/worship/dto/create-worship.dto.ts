import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WorshipItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsString({ message: 'O título do item é obrigatório.' })
  @MinLength(1)
  @MaxLength(120, { message: 'Título do item muito longo.' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  responsible?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class WorshipParticipantDto {
  @IsOptional()
  @IsString()
  memberId?: string;

  @IsString({ message: 'O nome do participante é obrigatório.' })
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString({ message: 'A função do participante é obrigatória.' })
  @MinLength(1)
  @MaxLength(80)
  role!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateWorshipDto {
  @IsString({ message: 'O título é obrigatório.' })
  @MinLength(2, { message: 'O título deve ter ao menos 2 caracteres.' })
  @MaxLength(120, { message: 'O título é muito longo.' })
  title!: string;

  @IsISO8601({}, { message: 'Data inválida.' })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Tema muito longo.' })
  theme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Referência bíblica muito longa.' })
  bibleRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Observações muito longas.' })
  notes?: string;

  @IsOptional()
  @IsIn(['PLANNED', 'DONE', 'CANCELED'], { message: 'Status inválido.' })
  status?: 'PLANNED' | 'DONE' | 'CANCELED';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorshipItemDto)
  items?: WorshipItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorshipParticipantDto)
  participants?: WorshipParticipantDto[];
}
