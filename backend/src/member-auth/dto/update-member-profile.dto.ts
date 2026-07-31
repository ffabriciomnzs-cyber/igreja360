import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsString()
  // Bloqueia e-mail digitado no campo nome (aconteceu de verdade: o
  // cadastro ficava exibindo o e-mail na carteirinha e no ranking).
  @Matches(/^[^@]*$/, { message: 'O campo nome não pode conter um e-mail — informe o nome da pessoa.' })
  @MinLength(2, { message: 'Nome muito curto.' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Sexo inválido.' })
  gender?: Gender;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}
