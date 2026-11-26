import { IsUUID } from 'class-validator';

export class UpsertPredictionDto {
  @IsUUID('all', { message: 'nomineeId inválido' })
  nomineeId!: string;
}
