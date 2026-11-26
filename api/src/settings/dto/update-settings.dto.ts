import { IsISO8601, Matches, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
  // Obrigatório: uma data ISO 8601 COM fuso (ex.: "2026-12-10T21:00:00-03:00"),
  // ou null para remover o bloqueio. Sem fuso, o horário seria interpretado
  // no fuso do servidor (UTC no Docker), o que causaria um erro de 3 horas.
  @ValidateIf((_, value) => value !== null)
  @IsISO8601(
    { strict: true },
    { message: 'predictionsLockAt deve ser uma data ISO 8601 ou null' },
  )
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, {
    message:
      'predictionsLockAt precisa informar o fuso (ex.: "2026-12-10T21:00:00-03:00")',
  })
  predictionsLockAt!: string | null;
}
