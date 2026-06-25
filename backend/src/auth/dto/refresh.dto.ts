import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsNotEmpty({ message: 'refreshToken é obrigatório.' })
  refreshToken!: string;
}
