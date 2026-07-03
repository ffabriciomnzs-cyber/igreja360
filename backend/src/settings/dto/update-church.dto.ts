import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateChurchDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome muito curto.' })
  @MaxLength(120, { message: 'Nome muito longo.' })
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  cardLogo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  denomination?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  site?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceHours?: string;
}
