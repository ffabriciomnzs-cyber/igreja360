import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome muito curto.' })
  @MaxLength(120, { message: 'Nome muito longo.' })
  name?: string;
}
