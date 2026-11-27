import { Badge, Box, Heading, HStack, Icon, RadioCard, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import { LuCheck, LuCircleDashed, LuCrown, LuX } from 'react-icons/lu'
import type { Category } from './types'

interface CategoryCardProps {
  category: Category
  position: number
  locked: boolean
  saving: boolean
  onSelect: (nomineeId: string) => void
}

export function CategoryCard({ category, position, locked, saving, onSelect }: CategoryCardProps) {
  const { myNomineeId, winnerNomineeId } = category
  const hasWinner = winnerNomineeId !== null
  const hit = hasWinner && myNomineeId === winnerNomineeId

  return (
    <Box
      as="section"
      id={category.slug}
      bg="bg.panel"
      borderWidth="1px"
      borderColor={category.isGoty ? 'gold.emphasized' : 'border'}
      borderRadius="md"
      p={{ base: '4', md: '6' }}
      // Compensa a barra fixa do topo ao rolar até a categoria
      scrollMarginTop="28"
    >
      <Stack gap="4">
        <HStack justify="space-between" align="start" gap="4">
          <Stack gap="1">
            <HStack gap="2">
              <Text color="gold.fg" fontSize="xs" fontWeight="semibold" letterSpacing="0.2em">
                {String(position).padStart(2, '0')}
              </Text>
              {category.isGoty && (
                <Badge variant="subtle" size="sm">
                  <Icon as={LuCrown} /> Desempate
                </Badge>
              )}
              {category.points !== 1 && (
                <Badge variant="outline" size="sm">
                  {category.points} pts
                </Badge>
              )}
            </HStack>
            <Heading as="h2" size={{ base: 'lg', md: 'xl' }}>
              {category.name}
            </Heading>
          </Stack>

          <CategoryStatus saving={saving} picked={myNomineeId !== null} hasWinner={hasWinner} hit={hit} />
        </HStack>

        <RadioCard.Root
          value={myNomineeId}
          onValueChange={({ value }) => value && value !== myNomineeId && onSelect(value)}
          readOnly={locked}
          variant="surface"
          size="sm"
          aria-label={`Palpite para ${category.name}`}
        >
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="2">
            {category.nominees.map((nominee) => {
              const isWinner = nominee.id === winnerNomineeId
              return (
                <RadioCard.Item
                  key={nominee.id}
                  value={nominee.id}
                  cursor={locked ? 'default' : 'pointer'}
                  // Depois do bloqueio, apaga visualmente quem não é palpite nem vencedor
                  opacity={locked && nominee.id !== myNomineeId && !isWinner ? 0.55 : 1}
                  borderColor={isWinner ? 'green.solid' : undefined}
                >
                  <RadioCard.ItemHiddenInput />
                  <RadioCard.ItemControl>
                    <RadioCard.ItemContent>
                      <RadioCard.ItemText fontWeight="semibold">{nominee.name}</RadioCard.ItemText>
                      {nominee.subtitle && (
                        <RadioCard.ItemDescription>{nominee.subtitle}</RadioCard.ItemDescription>
                      )}
                      {isWinner && (
                        <Badge colorPalette="green" variant="solid" size="sm" mt="1">
                          <Icon as={LuCrown} /> Vencedor
                        </Badge>
                      )}
                    </RadioCard.ItemContent>
                    <RadioCard.ItemIndicator />
                  </RadioCard.ItemControl>
                </RadioCard.Item>
              )
            })}
          </SimpleGrid>
        </RadioCard.Root>
      </Stack>
    </Box>
  )
}

interface CategoryStatusProps {
  saving: boolean
  picked: boolean
  hasWinner: boolean
  hit: boolean
}

function CategoryStatus({ saving, picked, hasWinner, hit }: CategoryStatusProps) {
  if (saving) {
    return (
      <HStack gap="1.5" color="fg.muted" fontSize="xs" flexShrink="0">
        <Spinner size="xs" />
        <Text>Salvando</Text>
      </HStack>
    )
  }
  if (hasWinner) {
    return (
      <Badge colorPalette={hit ? 'green' : 'red'} variant="subtle" flexShrink="0">
        <Icon as={hit ? LuCheck : LuX} /> {hit ? 'Acertou' : 'Errou'}
      </Badge>
    )
  }
  if (picked) {
    return (
      <HStack gap="1" color="gold.fg" fontSize="xs" flexShrink="0">
        <Icon as={LuCheck} />
        <Text>Salvo</Text>
      </HStack>
    )
  }
  return (
    <HStack gap="1" color="fg.subtle" fontSize="xs" flexShrink="0">
      <Icon as={LuCircleDashed} />
      <Text>Pendente</Text>
    </HStack>
  )
}
