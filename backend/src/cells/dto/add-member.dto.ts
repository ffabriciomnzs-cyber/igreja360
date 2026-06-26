import { IsString } from 'class-validator';

export class AddMemberDto {
  @IsString({ message: 'Membro inválido.' })
  memberId!: string;
}
