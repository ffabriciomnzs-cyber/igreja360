import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  @MaxLength(120, { message: 'O nome é muito longo.' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Descrição muito longa.' })
  description?: string;

  @IsISO8601({}, { message: 'Data inválida.' })
  date!: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de término inválida.' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'Local muito longo.' })
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Capacidade inválida.' })
  @Min(1, { message: 'Capacidade inválida.' })
  capacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'Tipo inválido.' })
  type?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}
