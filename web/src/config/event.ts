// Informações fixas do evento, exibidas na tela inicial (que é pública e,
// por isso, não consulta a API, que exige login).
export const EVENT = {
  name: 'The Game Awards 2026',
  // 19h30 em Nova York = 21h30 em Brasília
  ceremonyAt: new Date('2026-12-10T19:30:00-05:00'),
  categoriesCount: 27,
}

export const formatBrasilia = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', ...options })
