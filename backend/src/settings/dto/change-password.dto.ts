import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Informe a senha atual.' })
  currentPassword!: string;

  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter ao menos 6 caracteres.' })
  newPassword!: string;
}
