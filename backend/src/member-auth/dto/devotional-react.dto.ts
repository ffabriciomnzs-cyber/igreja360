import { IsIn } from 'class-validator';

export class DevotionalReactDto {
  @IsIn(['amem', 'heart', 'praise', 'fire'], {
    message: 'Reação inválida.',
  })
  type!: string;
}
