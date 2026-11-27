import { IsUUID } from 'class-validator';

export class SetWinnerDto {
  @IsUUID('all', { message: 'nomineeId inválido' })
  nomineeId!: string;
}
