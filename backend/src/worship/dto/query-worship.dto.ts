import { IsIn, IsOptional } from 'class-validator';

export class QueryWorshipDto {
  @IsOptional()
  @IsIn(['upcoming', 'past', 'all'])
  when?: 'upcoming' | 'past' | 'all';
}
