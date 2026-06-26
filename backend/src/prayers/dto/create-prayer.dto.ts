import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PrayerStatus } from '@prisma/client';

export class CreatePrayerDto {
  @IsString({ message: 'O título é obrigatório.' })
  @MinLength(2, { message: 'Título muito curto.' })
  @MaxLength(160, { message: 'Título muito longo.' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Descrição muito longa.' })
  description?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsEnum(PrayerStatus, { message: 'Status inválido.' })
  status?: PrayerStatus;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  visibility?: string;
}
