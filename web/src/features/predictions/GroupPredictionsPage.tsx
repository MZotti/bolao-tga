import { Alert, Badge, Box, Center, Container, Heading, HStack, Icon, Stack, Text, Wrap } from '@chakra-ui/react'
import { LuCrown, LuEyeOff, LuTimer } from 'react-icons/lu'
import { LiveBadge } from '@/components/layout/LiveBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useMe } from '@/features/auth/api'
import { formatRemaining, useLockCountdown } from '@/features/settings/useLockCountdown'
import { useCategories, useGroupPredictions } from './api'
import type { Category, GroupPrediction } from './types'

export function GroupPredictionsPage() {
  const countdown = useLockCountdown()

  return (
    <Container maxW="4xl" py={{ base: '6', md: '10' }}>
      <Stack gap="6">
        <PageHeader
          title="Palpites da galera"
          description="Quem apostou em quem, categoria por categoria."
        />
        {countdown.isPending ? (
          <PageSpinner />
        ) : countdown.locked ? (
          <GroupPredictions />
        ) : (
          <HiddenUntilLock remainingMs={countdown.remainingMs} />
        )}
      </Stack>
    </Container>
  )
}

function HiddenUntilLock({ remainingMs }: { remainingMs: number | null }) {
  return (
    <Center bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="md" py="16" px="6">
      <Stack gap="3" align="center" textAlign="center" maxW="md">
        <Icon as={LuEyeOff} boxSize="8" color="gold.solid" />
        <Heading size="lg">Ainda em segredo</Heading>
        <Text color="fg.muted">
          Os palpites de todo mundo aparecem aqui quando os palpites encerrarem, para ninguém copiar
          ninguém.
        </Text>
        {remainingMs !== null && (
          <HStack gap="2" fontSize="sm" color="fg.muted">
            <Icon as={LuTimer} color="gold.solid" />
            <Text>
              Revelação em{' '}
              <Text as="span" fontFamily="mono" fontWeight="semibold" color="fg">
                {formatRemaining(remainingMs)}
              </Text>
            </Text>
          </HStack>
        )}
      </Stack>
    </Center>
  )
}

function GroupPredictions() {
  const categories = useCategories({ refetchInterval: 30_000 })
  const predictions = useGroupPredictions({ enabled: true, refetchInterval: 30_000 })
  const { data: me } = useMe()

  if (categories.isPending || predictions.isPending) return <PageSpinner />
  if (categories.isError || predictions.isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{(categories.error ?? predictions.error)?.message}</Alert.Title>
      </Alert.Root>
    )
  }

  // categoria -> indicado -> nomes de quem escolheu
  const byCategory = new Map<string, Map<string, GroupPrediction['user'][]>>()
  for (const p of predictions.data) {
    const byNominee = byCategory.get(p.categoryId) ?? new Map<string, GroupPrediction['user'][]>()
    byNominee.set(p.nomineeId, [...(byNominee.get(p.nomineeId) ?? []), p.user])
    byCategory.set(p.categoryId, byNominee)
  }

  const announcing = categories.data.some((c) => !c.winnerNomineeId)

  return (
    <Stack gap="4">
      {announcing && <LiveBadge />}
      {categories.data.map((category, i) => (
        <GroupCategoryCard
          key={category.id}
          category={category}
          position={i + 1}
          picks={byCategory.get(category.id) ?? new Map()}
          meId={me?.id}
        />
      ))}
    </Stack>
  )
}

interface GroupCategoryCardProps {
  category: Category
  position: number
  picks: Map<string, GroupPrediction['user'][]>
  meId?: string
}

function GroupCategoryCard({ category, position, picks, meId }: GroupCategoryCardProps) {
  // Mostra só indicados que receberam palpite (e o vencedor, mesmo sem palpite),
  // do mais votado para o menos votado
  const rows = category.nominees
    .map((n) => ({ nominee: n, users: picks.get(n.id) ?? [], isWinner: n.id === category.winnerNomineeId }))
    .filter((r) => r.users.length > 0 || r.isWinner)
    .sort((a, b) => Number(b.isWinner) - Number(a.isWinner) || b.users.length - a.users.length)

  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor={category.isGoty ? 'gold.emphasized' : 'border'} borderRadius="md" p={{ base: '4', md: '5' }}>
      <Stack gap="3">
        <Stack gap="1">
          <Text color="gold.fg" fontSize="xs" fontWeight="semibold" letterSpacing="0.2em">
            {String(position).padStart(2, '0')}
          </Text>
          <Heading as="h2" size="lg">
            {category.name}
          </Heading>
        </Stack>

        {rows.length === 0 ? (
          <Text fontSize="sm" color="fg.subtle">
            Ninguém palpitou nesta categoria.
          </Text>
        ) : (
          <Stack gap="2">
            {rows.map(({ nominee, users, isWinner }) => (
              <Box
                key={nominee.id}
                borderWidth="1px"
                borderColor={isWinner ? 'green.solid' : 'border.muted'}
                bg={isWinner ? 'green.subtle' : 'transparent'}
                borderRadius="sm"
                px="3"
                py="2.5"
              >
                <HStack justify="space-between" align="start" gap="3" mb={users.length ? '2' : '0'}>
                  <HStack gap="2" flexWrap="wrap">
                    <Text fontWeight="semibold">{nominee.name}</Text>
                    {isWinner && (
                      <Badge colorPalette="green" variant="solid" size="sm">
                        <Icon as={LuCrown} /> Vencedor
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="fg.muted" flexShrink="0">
                    {users.length} {users.length === 1 ? 'palpite' : 'palpites'}
                  </Text>
                </HStack>
                {users.length > 0 && (
                  <Wrap gap="1.5">
                    {users.map((u) => (
                      <Badge key={u.id} variant={u.id === meId ? 'solid' : 'outline'} colorPalette={u.id === meId ? 'gold' : 'gray'} size="sm">
                        {u.id === meId ? 'Você' : u.name}
                      </Badge>
                    ))}
                  </Wrap>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
