import { Badge, Box, Button, Field, HStack, Input, Stack, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatBrasilia } from '@/config/event'
import { formatRemaining, useLockCountdown } from '@/features/settings/useLockCountdown'
import { useUpdateLock } from './api'

// <input type="datetime-local"> trabalha sem fuso ("2026-12-10T21:00").
// Aqui ele é SEMPRE interpretado no horário de Brasília (UTC-3, sem horário de verão).
const BRASILIA_OFFSET = '-03:00'

/** Date -> "YYYY-MM-DDTHH:mm" no horário de Brasília (formato do datetime-local). */
function toBrasiliaInput(date: Date): string {
  // O locale sv-SE formata como "2026-12-10 21:00:00"
  return date.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T').slice(0, 16)
}

const lockSchema = z.object({
  lockAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Informe data e hora'),
})
type LockForm = z.infer<typeof lockSchema>

export function LockPanel() {
  const countdown = useLockCountdown()
  const updateLock = useUpdateLock()
  const [confirmingClose, setConfirmingClose] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LockForm>({
    resolver: zodResolver(lockSchema),
    values: { lockAt: countdown.lockAt ? toBrasiliaInput(countdown.lockAt) : '' },
  })

  const onSubmit = handleSubmit(({ lockAt }) => {
    updateLock.mutate(`${lockAt}:00${BRASILIA_OFFSET}`)
  })

  const closeNow = () => {
    setConfirmingClose(false)
    updateLock.mutate(new Date().toISOString())
  }

  return (
    <Stack gap="6" maxW="lg">
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="md" p="5">
        <Stack gap="2">
          <HStack gap="2">
            <Text fontSize="sm" color="fg.muted">
              Situação:
            </Text>
            {countdown.locked ? (
              <Badge colorPalette="red" variant="subtle">
                Palpites encerrados
              </Badge>
            ) : (
              <Badge colorPalette="green" variant="subtle">
                Palpites abertos
              </Badge>
            )}
          </HStack>
          <Text>
            {countdown.lockAt
              ? `Encerramento: ${formatBrasilia(countdown.lockAt, { dateStyle: 'full', timeStyle: 'short' })} (Brasília)`
              : 'Sem horário de encerramento definido: os palpites ficam abertos.'}
          </Text>
          {!countdown.locked && countdown.remainingMs !== null && (
            <Text fontSize="sm" color="fg.muted">
              Faltam <Text as="span" fontFamily="mono" color="fg">{formatRemaining(countdown.remainingMs)}</Text>
            </Text>
          )}
        </Stack>
      </Box>

      <form onSubmit={onSubmit} noValidate>
        <Stack gap="3">
          <Field.Root invalid={!!errors.lockAt}>
            <Field.Label>Novo horário de encerramento (Brasília)</Field.Label>
            <Input type="datetime-local" {...register('lockAt')} />
            <Field.ErrorText>{errors.lockAt?.message}</Field.ErrorText>
          </Field.Root>
          <HStack>
            <Button type="submit" loading={updateLock.isPending}>
              Salvar horário
            </Button>
          </HStack>
        </Stack>
      </form>

      <Stack gap="3" borderTopWidth="1px" borderColor="border" pt="5">
        <Text fontSize="sm" color="fg.muted">
          Ações rápidas. Depois que houver vencedores marcados, não é possível reabrir os palpites.
        </Text>
        <HStack gap="3" flexWrap="wrap">
          {!countdown.locked &&
            (confirmingClose ? (
              <>
                <Button colorPalette="red" onClick={closeNow} loading={updateLock.isPending}>
                  Confirmar: encerrar agora
                </Button>
                <Button variant="ghost" colorPalette="gray" onClick={() => setConfirmingClose(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="outline" colorPalette="red" onClick={() => setConfirmingClose(true)}>
                Encerrar palpites agora
              </Button>
            ))}
          {countdown.lockAt && (
            <Button variant="outline" colorPalette="gray" onClick={() => updateLock.mutate(null)} loading={updateLock.isPending}>
              Remover horário (reabrir)
            </Button>
          )}
        </HStack>
      </Stack>
    </Stack>
  )
}
