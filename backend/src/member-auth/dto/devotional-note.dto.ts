import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DevotionalNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Anotação muito longa.' })
  text?: string;
}
