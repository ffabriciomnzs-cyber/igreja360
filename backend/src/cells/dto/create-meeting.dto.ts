import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMeetingDto {
  @IsISO8601({}, { message: 'Data da reunião inválida.' })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Tema muito longo.' })
  theme?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Número de presentes inválido.' })
  @Min(0, { message: 'Número de presentes inválido.' })
  attendees?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Anotações muito longas.' })
  notes?: string;
}
