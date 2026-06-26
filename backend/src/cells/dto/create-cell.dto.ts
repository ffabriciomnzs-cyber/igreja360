import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCellDto {
  @IsString({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  @MaxLength(120, { message: 'O nome é muito longo.' })
  name!: string;

  @IsOptional()
  @IsString()
  leaderId?: string;

  @IsOptional()
  @IsString()
  coLeaderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Dia inválido.' })
  dayOfWeek?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Horário inválido.' })
  time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Endereço muito longo.' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Bairro inválido.' })
  neighborhood?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Capacidade inválida.' })
  @Min(1, { message: 'Capacidade inválida.' })
  capacity?: number;

  @IsOptional()
  @IsBoolean({ message: 'Valor de ativo inválido.' })
  active?: boolean;
}
