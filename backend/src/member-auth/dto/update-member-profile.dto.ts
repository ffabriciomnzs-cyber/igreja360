import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome muito curto.' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

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
