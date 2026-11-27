import { Alert, Button, Container, HStack, SegmentGroup, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useLockCountdown } from '@/features/settings/useLockCountdown'
import { useCategories, useSavingCategoryIds, useUpsertPrediction } from './api'
import { CategoryCard } from './CategoryCard'
import { PredictionsSummary } from './PredictionsSummary'

type Filter = 'all' | 'pending'

const filterItems = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
]

export function PredictionsPage() {
  const countdown = useLockCountdown()
  // Depois do bloqueio, recarrega a cada 30s para mostrar os vencedores ao vivo
  const categoriesQuery = useCategories({ refetchInterval: countdown.locked ? 30_000 : false })
  const upsert = useUpsertPrediction()
  const savingIds = useSavingCategoryIds()

  const [filter, setFilter] = useState<Filter>('all')
  // Ao escolher "Pendentes", congela a lista naquele momento: a categoria que
  // você acabou de preencher não some debaixo do seu dedo.
  const [pendingSnapshot, setPendingSnapshot] = useState<Set<string>>(new Set())

  if (categoriesQuery.isPending || countdown.isPending) return <PageSpinner />

  if (categoriesQuery.isError) {
    return (
      <Container maxW="4xl" py="10">
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Não foi possível carregar as categorias</Alert.Title>
            <Alert.Description>{categoriesQuery.error.message}</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="outline" onClick={() => categoriesQuery.refetch()}>
            Tentar de novo
          </Button>
        </Alert.Root>
      </Container>
    )
  }

  const categories = categoriesQuery.data
  const filled = categories.filter((c) => c.myNomineeId !== null).length
  const { locked } = countdown

  const changeFilter = (value: Filter) => {
    if (value === 'pending') {
      setPendingSnapshot(new Set(categories.filter((c) => c.myNomineeId === null).map((c) => c.id)))
    }
    setFilter(value)
  }

  const visible = filter === 'pending' ? categories.filter((c) => pendingSnapshot.has(c.id)) : categories

  return (
    <>
      <PredictionsSummary
        filled={filled}
        total={categories.length}
        locked={locked}
        lockAt={countdown.lockAt}
        remainingMs={countdown.remainingMs}
      />

      <Container maxW="4xl" py={{ base: '6', md: '10' }}>
        <Stack gap="6">
          <PageHeader
            title="Meus palpites"
            description={
              locked
                ? 'Os palpites foram encerrados. Os vencedores aparecem aqui conforme forem anunciados.'
                : 'Toque no indicado que você acha que vai vencer. Cada escolha é salva na hora, e você pode trocar até o encerramento.'
            }
          />

          {!locked && (
            <HStack justify="space-between" flexWrap="wrap" gap="3">
              <SegmentGroup.Root
                value={filter}
                onValueChange={({ value }) => value && changeFilter(value as Filter)}
                size="sm"
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={filterItems} />
              </SegmentGroup.Root>
              {filter === 'pending' && (
                <Text fontSize="sm" color="fg.muted">
                  {pendingSnapshot.size === 0
                    ? 'Nenhuma categoria pendente 🎉'
                    : `${categories.length - filled} restante(s)`}
                </Text>
              )}
            </HStack>
          )}

          <Stack gap="4">
            {visible.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                position={categories.indexOf(category) + 1}
                locked={locked}
                saving={savingIds.has(category.id)}
                onSelect={(nomineeId) => upsert.mutate({ categoryId: category.id, nomineeId })}
              />
            ))}
          </Stack>
        </Stack>
      </Container>
    </>
  )
}
