import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { WorshipItemDto, WorshipParticipantDto } from './create-worship.dto';

export class UpdateWorshipDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O título deve ter ao menos 2 caracteres.' })
  @MaxLength(120, { message: 'O título é muito longo.' })
  title?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data inválida.' })
  date?: string;

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
