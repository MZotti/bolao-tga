import { Alert, Badge, Box, Center, Container, HStack, Icon, Progress, Stack, Text } from '@chakra-ui/react'
import { LuCrown, LuLock, LuTimer } from 'react-icons/lu'
import { LiveBadge } from '@/components/layout/LiveBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useMe } from '@/features/auth/api'
import { formatRemaining, useLockCountdown } from '@/features/settings/useLockCountdown'
import { type Leaderboard, type LeaderboardRow, type PlayerProgress, useLeaderboard, useProgress } from './api'

export function RankingPage() {
  const countdown = useLockCountdown()
  const { locked } = countdown

  return (
    <Container maxW="3xl" py={{ base: '6', md: '10' }}>
      <Stack gap="6">
        <PageHeader
          title="Ranking"
          description={
            locked
              ? '1 ponto por acerto. No empate, fica na frente quem acertou o Jogo do Ano.'
              : 'O ranking começa quando os palpites encerrarem. Por enquanto, veja quem já preencheu.'
          }
        />
        {countdown.isPending ? <PageSpinner /> : locked ? <LiveRanking /> : <FillProgress remainingMs={countdown.remainingMs} />}
      </Stack>
    </Container>
  )
}

// ---------- Antes do bloqueio: progresso de preenchimento ----------

function FillProgress({ remainingMs }: { remainingMs: number | null }) {
  const { data: me } = useMe()
  const progress = useProgress({ refetchInterval: 30_000 })

  if (progress.isPending) return <PageSpinner />
  if (progress.isError) return <ErrorAlert message={progress.error.message} />

  const players = [...progress.data].sort((a, b) => b.filled - a.filled || a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <Stack gap="4">
      {remainingMs !== null && (
        <HStack gap="2" color="fg.muted" fontSize="sm">
          <Icon as={LuTimer} color="gold.solid" />
          <Text>
            Palpites encerram em{' '}
            <Text as="span" fontFamily="mono" fontWeight="semibold" color="fg">
              {formatRemaining(remainingMs)}
            </Text>
          </Text>
        </HStack>
      )}

      {players.length === 0 ? (
        <EmptyNote>Ninguém se cadastrou ainda.</EmptyNote>
      ) : (
        <Stack gap="2">
          {players.map((p) => (
            <ProgressRow key={p.userId} player={p} isMe={p.userId === me?.id} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function ProgressRow({ player, isMe }: { player: PlayerProgress; isMe: boolean }) {
  const complete = player.filled === player.total
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor={isMe ? 'gold.emphasized' : 'border'} borderRadius="md" px="4" py="3">
      <Stack gap="2">
        <HStack justify="space-between">
          <HStack gap="2">
            <Text fontWeight="semibold">{player.name}</Text>
            {isMe && <Badge size="sm">você</Badge>}
          </HStack>
          <Text fontSize="sm" color={complete ? 'gold.fg' : 'fg.muted'} fontVariantNumeric="tabular-nums">
            {complete ? 'completo' : `${player.filled}/${player.total}`}
          </Text>
        </HStack>
        <Progress.Root value={(player.filled / player.total) * 100} size="xs" aria-label={`Progresso de ${player.name}`}>
          <Progress.Track bg="bg.emphasized">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Stack>
    </Box>
  )
}

// ---------- Depois do bloqueio: ranking ao vivo ----------

function LiveRanking() {
  const { data: me } = useMe()
  const leaderboard = useLeaderboard({ refetchInterval: 15_000 })

  if (leaderboard.isPending) return <PageSpinner />
  if (leaderboard.isError) return <ErrorAlert message={leaderboard.error.message} />

  const data: Leaderboard = leaderboard.data
  const finished = data.decidedCategories === data.totalCategories

  return (
    <Stack gap="5">
      <Stack gap="2">
        <HStack justify="space-between">
          {finished ? (
            <HStack gap="2" color="gold.fg" fontSize="xs" fontWeight="bold" letterSpacing="0.2em">
              <Icon as={LuCrown} />
              <Text>RESULTADO FINAL</Text>
            </HStack>
          ) : (
            <LiveBadge />
          )}
          <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
            {data.decidedCategories}/{data.totalCategories} categorias anunciadas
          </Text>
        </HStack>
        <Progress.Root value={(data.decidedCategories / data.totalCategories) * 100} size="xs" aria-label="Categorias anunciadas">
          <Progress.Track bg="bg.emphasized">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Stack>

      {data.decidedCategories === 0 && (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator>
            <LuLock />
          </Alert.Indicator>
          <Alert.Title>Palpites encerrados. Aguardando o primeiro vencedor ser anunciado…</Alert.Title>
        </Alert.Root>
      )}

      {data.players.length === 0 ? (
        <EmptyNote>Nenhum participante no bolão.</EmptyNote>
      ) : (
        <Stack gap="2">
          {data.players.map((row) => (
            <RankingRow key={row.userId} row={row} isMe={row.userId === me?.id} showGoty={data.gotyDecided} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function RankingRow({ row, isMe, showGoty }: { row: LeaderboardRow; isMe: boolean; showGoty: boolean }) {
  const first = row.rank === 1
  const podium = row.rank <= 3

  return (
    <HStack
      bg={first ? 'gold.subtle' : 'bg.panel'}
      borderWidth="1px"
      borderColor={first ? 'gold.solid' : isMe ? 'gold.emphasized' : 'border'}
      borderRadius="md"
      px={{ base: '3', md: '5' }}
      py={{ base: '3', md: '4' }}
      gap={{ base: '3', md: '4' }}
    >
      <Center
        boxSize={{ base: '9', md: '11' }}
        flexShrink="0"
        borderRadius="full"
        borderWidth={podium && !first ? '1px' : '0'}
        borderColor="gold.solid"
        bg={first ? 'gold.solid' : 'transparent'}
        color={first ? 'gold.contrast' : podium ? 'gold.fg' : 'fg.muted'}
        fontFamily="heading"
        fontWeight="700"
        fontSize={{ base: 'md', md: 'lg' }}
      >
        {row.rank}º
      </Center>

      <Stack gap="0.5" flex="1" minW="0">
        <HStack gap="2">
          <Text fontWeight="semibold" truncate>
            {row.name}
          </Text>
          {isMe && <Badge size="sm">você</Badge>}
        </HStack>
        <HStack gap="3" fontSize="xs" color="fg.muted">
          <Text>
            {row.hits} {row.hits === 1 ? 'acerto' : 'acertos'}
          </Text>
          {showGoty && row.gotyHit && (
            <HStack gap="1" color="gold.fg">
              <Icon as={LuCrown} />
              <Text>acertou o GOTY</Text>
            </HStack>
          )}
        </HStack>
      </Stack>

      <Stack gap="0" align="end">
        <Text fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" lineHeight="1" color={first ? 'gold.fg' : 'fg'}>
          {row.points}
        </Text>
        <Text fontSize="2xs" color="fg.subtle" letterSpacing="0.15em">
          PONTOS
        </Text>
      </Stack>
    </HStack>
  )
}

// ---------- Auxiliares ----------

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Title>{message}</Alert.Title>
    </Alert.Root>
  )
}

function EmptyNote({ children }: { children: string }) {
  return (
    <Center py="10" color="fg.muted" fontSize="sm">
      {children}
    </Center>
  )
}
