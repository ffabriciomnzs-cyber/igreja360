import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePrayerDto {
  @IsString()
  @MinLength(2, { message: 'Descreva seu pedido.' })
  @MaxLength(160, { message: 'Título muito longo.' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
