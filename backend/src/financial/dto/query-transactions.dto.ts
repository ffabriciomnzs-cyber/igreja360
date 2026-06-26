import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class QueryTransactionsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TransactionType, { message: 'Tipo inválido.' })
  type?: TransactionType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data inicial inválida.' })
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data final inválida.' })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página inválida.' })
  @Min(1, { message: 'Página inválida.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite inválido.' })
  @Min(1, { message: 'Limite inválido.' })
  @Max(100, { message: 'Limite máximo é 100.' })
  limit?: number = 20;
}
