import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceScheduleItemDto {
  @IsInt({ message: 'Dia da semana inválido.' })
  @Min(0, { message: 'Dia da semana inválido.' })
  @Max(6, { message: 'Dia da semana inválido.' })
  weekday!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Horário inválido — use o formato 19:30.',
  })
  time!: string;

  @IsString()
  @MinLength(2, { message: 'Informe o nome do culto.' })
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ServiceSchedulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceScheduleItemDto)
  schedules!: ServiceScheduleItemDto[];
}
