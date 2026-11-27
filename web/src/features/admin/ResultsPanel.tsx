import { Alert, Box, Button, Heading, HStack, Icon, Progress, Stack, Text, Wrap } from '@chakra-ui/react'
import { LuCrown, LuUndo2 } from 'react-icons/lu'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useCategories } from '@/features/predictions/api'
import type { Category } from '@/features/predictions/types'
import { useLockCountdown } from '@/features/settings/useLockCountdown'
import { useSetWinner } from './api'

/**
 * Marcação dos vencedores durante a cerimônia.
 * Um toque no indicado já marca; a categoria "fecha" mostrando o vencedor,
 * com um botão para desfazer caso tenha tocado errado.
 */
export function ResultsPanel() {
  const { locked } = useLockCountdown()
  const categories = useCategories()
  const setWinner = useSetWinner()

  if (categories.isPending) return <PageSpinner />
  if (categories.isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{categories.error.message}</Alert.Title>
      </Alert.Root>
    )
  }

  const decided = categories.data.filter((c) => c.winnerNomineeId).length
  const total = categories.data.length

  return (
    <Stack gap="5">
      {!locked && (
        <Alert.Root status="warning" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Os palpites ainda estão abertos</Alert.Title>
            <Alert.Description>
              Os vencedores só podem ser marcados depois do encerramento (senão alguém poderia trocar o
              palpite já sabendo o resultado). Para encerrar antes, use a aba Bloqueio.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Stack gap="2">
        <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
          {decided}/{total} categorias com vencedor
        </Text>
        <Progress.Root value={(decided / total) * 100} size="xs" aria-label="Categorias com vencedor">
          <Progress.Track bg="bg.emphasized">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Stack>

      <Stack gap="3">
        {categories.data.map((category) => (
          <ResultRow
            key={category.id}
            category={category}
            disabled={!locked}
            onSet={(nomineeId) => setWinner.mutate({ categoryId: category.id, nomineeId })}
          />
        ))}
      </Stack>
    </Stack>
  )
}

interface ResultRowProps {
  category: Category
  disabled: boolean
  onSet: (nomineeId: string | null) => void
}

function ResultRow({ category, disabled, onSet }: ResultRowProps) {
  const winner = category.nominees.find((n) => n.id === category.winnerNomineeId)

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor={winner ? 'green.muted' : 'border'}
      borderRadius="md"
      p="4"
      opacity={disabled ? 0.6 : 1}
    >
      <Stack gap="3">
        <HStack justify="space-between" gap="3">
          <Heading as="h3" size="md">
            {category.name}
          </Heading>
          {winner && (
            <Button size="xs" variant="ghost" colorPalette="gray" onClick={() => onSet(null)}>
              <LuUndo2 /> Desfazer
            </Button>
          )}
        </HStack>

        {winner ? (
          <HStack gap="2" color="green.fg">
            <Icon as={LuCrown} />
            <Text fontWeight="semibold">{winner.name}</Text>
          </HStack>
        ) : (
          <Wrap gap="2">
            {category.nominees.map((nominee) => (
              <Button
                key={nominee.id}
                size="sm"
                variant="outline"
                colorPalette="gray"
                textTransform="none"
                letterSpacing="normal"
                disabled={disabled}
                onClick={() => onSet(nominee.id)}
              >
                {nominee.name}
              </Button>
            ))}
          </Wrap>
        )}
      </Stack>
    </Box>
  )
}
