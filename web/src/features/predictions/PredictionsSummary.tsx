import { Box, Container, HStack, Icon, Progress, Stack, Text } from '@chakra-ui/react'
import { LuLock, LuTimer } from 'react-icons/lu'
import { formatBrasilia } from '@/config/event'
import { formatRemaining } from '@/features/settings/useLockCountdown'

interface PredictionsSummaryProps {
  filled: number
  total: number
  locked: boolean
  lockAt: Date | null
  remainingMs: number | null
}

/** Barra fixa no topo: progresso de preenchimento + contagem regressiva. */
export function PredictionsSummary({ filled, total, locked, lockAt, remainingMs }: PredictionsSummaryProps) {
  const complete = filled === total

  return (
    <Box
      position="sticky"
      top="0"
      zIndex="sticky"
      bg="bg/85"
      backdropFilter="blur(10px)"
      borderBottomWidth="1px"
      borderColor="border"
    >
      <Container maxW="4xl" py="3">
        <Stack gap="2">
          <HStack justify="space-between" fontSize="sm" gap="4">
            <Text>
              <Box as="span" fontFamily="heading" fontSize="lg" fontWeight="600" color={complete ? 'gold.fg' : 'fg'}>
                {filled}/{total}
              </Box>{' '}
              <Box as="span" color="fg.muted">
                {complete ? 'tudo preenchido!' : 'categorias'}
              </Box>
            </Text>

            {locked ? (
              <HStack gap="1.5" color="fg.muted">
                <Icon as={LuLock} />
                <Text>Palpites encerrados</Text>
              </HStack>
            ) : remainingMs !== null && lockAt ? (
              <HStack gap="1.5" title={`Encerra em ${formatBrasilia(lockAt, { dateStyle: 'short', timeStyle: 'short' })}`}>
                <Icon as={LuTimer} color="gold.solid" />
                <Text color="fg.muted" display={{ base: 'none', sm: 'inline' }}>
                  Encerra em
                </Text>
                <Text fontFamily="mono" fontWeight="semibold" fontVariantNumeric="tabular-nums">
                  {formatRemaining(remainingMs)}
                </Text>
              </HStack>
            ) : null}
          </HStack>

          <Progress.Root value={total ? (filled / total) * 100 : 0} size="xs" aria-label="Progresso dos palpites">
            <Progress.Track bg="bg.emphasized">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Stack>
      </Container>
    </Box>
  )
}
