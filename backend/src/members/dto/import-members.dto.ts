import { ArrayMaxSize, IsArray } from 'class-validator';
import { CreateMemberDto } from './create-member.dto';

// Linhas vêm "cruas" da planilha; o service sanitiza e ignora as inválidas
// (sem validação estrita por linha, para não rejeitar o lote por uma célula).
export class ImportMembersDto {
  @IsArray()
  @ArrayMaxSize(2000, { message: 'Importe no máximo 2000 membros por vez.' })
  members!: CreateMemberDto[];
}
