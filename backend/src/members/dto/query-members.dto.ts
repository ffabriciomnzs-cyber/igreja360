import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MemberStatus } from '@prisma/client';

export class QueryMembersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Status inválido.' })
  status?: MemberStatus;

  @IsOptional()
  @IsString()
  cellId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página inválida.' })
  @Min(1, { message: 'Página inválida.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite inválido.' })
  @Min(1, { message: 'Limite inválido.' })
  @Max(100, { message: 'Limite máximo é 100.' })
  limit?: number = 20;
}
