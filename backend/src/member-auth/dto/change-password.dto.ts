import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Informe a senha atual.' })
  currentPassword!: string;

  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter ao menos 6 caracteres.' })
  @MaxLength(72)
  newPassword!: string;
}
