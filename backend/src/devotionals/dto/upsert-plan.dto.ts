import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PlanDayDto {
  @IsInt()
  dayNumber!: number;

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

  @IsString()
  @MinLength(1, { message: 'Escreva a reflexão do dia.' })
  @MaxLength(8000)
  reflection!: string;
}

export class UpsertPlanDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2, { message: 'Título muito curto.' })
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray()
  @ArrayMaxSize(366)
  @ValidateNested({ each: true })
  @Type(() => PlanDayDto)
  days!: PlanDayDto[];
}
