import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayableDto {
  @IsString()
  @MinLength(2, { message: 'Descreva a conta.' })
  @MaxLength(120)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  creditor?: string;

  @IsString()
  @MinLength(2, { message: 'Escolha a categoria.' })
  @MaxLength(60)
  category!: string;

  @Type(() => Number)
  @IsInt({ message: 'Número de parcelas inválido.' })
  @Min(2, { message: 'Uma conta parcelada tem no mínimo 2 parcelas.' })
  @Max(120, { message: 'No máximo 120 parcelas.' })
  installments!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor da parcela inválido.' })
  @Min(0.01, { message: 'O valor da parcela deve ser maior que zero.' })
  amount!: number;

  @IsISO8601({}, { message: 'Data do primeiro vencimento inválida.' })
  firstDueDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class PayInstallmentDto {
  /** Valor realmente pago — juros de atraso ou desconto mudam a parcela. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor pago inválido.' })
  @Min(0.01, { message: 'O valor pago deve ser maior que zero.' })
  amount?: number;

  @IsOptional()
  @IsISO8601({}, { message: 'Data do pagamento inválida.' })
  date?: string;
}
