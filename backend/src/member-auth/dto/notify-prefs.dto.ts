import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Preferências de notificação do membro. Campo ausente = mantém como está;
 * ausência total (prefs nulas no banco) = recebe tudo.
 */
export class NotifyPrefsDto {
  @IsOptional()
  @IsBoolean()
  announcements?: boolean;

  @IsOptional()
  @IsBoolean()
  worship?: boolean;

  @IsOptional()
  @IsBoolean()
  events?: boolean;

  @IsOptional()
  @IsBoolean()
  campaigns?: boolean;

  @IsOptional()
  @IsBoolean()
  birthdays?: boolean;
}
