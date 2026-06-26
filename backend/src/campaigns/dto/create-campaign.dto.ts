import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CampaignStatus } from '@prisma/client';

export class CreateCampaignDto {
  @IsString({ message: 'O título é obrigatório.' })
  @MinLength(2, { message: 'Título muito curto.' })
  @MaxLength(120, { message: 'Título muito longo.' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Descrição muito longa.' })
  description?: string;

  @IsString({ message: 'O tipo é obrigatório.' })
  @MaxLength(40, { message: 'Tipo inválido.' })
  type!: string;

  @IsOptional()
  @IsEnum(CampaignStatus, { message: 'Status inválido.' })
  status?: CampaignStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Meta inválida.' })
  @Min(0, { message: 'Meta inválida.' })
  goal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor inválido.' })
  @Min(0, { message: 'Valor inválido.' })
  current?: number;

  @IsOptional()
  @IsISO8601({}, { message: 'Data inicial inválida.' })
  startDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data final inválida.' })
  endDate?: string;
}
