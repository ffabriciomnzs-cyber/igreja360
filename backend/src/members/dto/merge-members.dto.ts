import { IsString } from 'class-validator';

export class MergeMembersDto {
  // Cadastro que permanece (recebe os dados e a atividade do outro).
  @IsString()
  keepId!: string;

  // Cadastro duplicado que será mesclado e removido.
  @IsString()
  dropId!: string;
}
