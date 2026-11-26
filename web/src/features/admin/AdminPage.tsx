import { Container, Stack, Tabs } from '@chakra-ui/react'
import { LuClock, LuTrophy, LuUsers } from 'react-icons/lu'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { LockPanel } from './LockPanel'
import { ResultsPanel } from './ResultsPanel'
import { UsersPanel } from './UsersPanel'

const TABS = ['resultados', 'bloqueio', 'participantes'] as const
type Tab = (typeof TABS)[number]

export function AdminPage() {
  // A aba fica na URL (/admin?aba=bloqueio): recarregar a página mantém a aba
  const [params, setParams] = useSearchParams()
  const current = TABS.includes(params.get('aba') as Tab) ? (params.get('aba') as Tab) : 'resultados'

  return (
    <Container maxW="4xl" py={{ base: '6', md: '10' }}>
      <Stack gap="6">
        <PageHeader title="Painel do admin" eyebrow="BOLÃO TGA 2026" />

        <Tabs.Root
          value={current}
          onValueChange={({ value }) => setParams({ aba: value }, { replace: true })}
          variant="line"
          lazyMount
        >
          <Tabs.List mb="6">
            <Tabs.Trigger value="resultados">
              <LuTrophy /> Resultados
            </Tabs.Trigger>
            <Tabs.Trigger value="bloqueio">
              <LuClock /> Bloqueio
            </Tabs.Trigger>
            <Tabs.Trigger value="participantes">
              <LuUsers /> Participantes
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="resultados">
            <ResultsPanel />
          </Tabs.Content>
          <Tabs.Content value="bloqueio">
            <LockPanel />
          </Tabs.Content>
          <Tabs.Content value="participantes">
            <UsersPanel />
          </Tabs.Content>
        </Tabs.Root>
      </Stack>
    </Container>
  )
}
