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
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType, { message: 'Tipo inválido.' })
  type!: TransactionType;

  @IsString({ message: 'A categoria é obrigatória.' })
  @MinLength(2, { message: 'Categoria inválida.' })
  @MaxLength(60, { message: 'Categoria muito longa.' })
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Descrição muito longa.' })
  description?: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Valor inválido.' },
  )
  @Min(0.01, { message: 'O valor deve ser maior que zero.' })
  amount!: number;

  @IsISO8601({}, { message: 'Data inválida.' })
  date!: string;
}
