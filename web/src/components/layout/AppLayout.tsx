import { Avatar, Box, Button, Container, Flex, HStack, Icon, Menu, Portal, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { LuChevronDown, LuKeyRound, LuListChecks, LuLogOut, LuMedal, LuSettings, LuTrophy, LuUsers } from 'react-icons/lu'
import { Navigate, NavLink, Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useLogout, useMe } from '@/features/auth/api'
import type { User } from '@/features/auth/types'
import { PredictionsStatusIcon } from '@/features/predictions/PredictionsStatusIcon'

interface NavEntry {
  to: string
  label: string
  icon: IconType
  /** Indicador exibido à esquerda do texto (ex.: status dos palpites) */
  status?: ReactNode
}

/** Itens de navegação de cada tipo de usuário. */
function navFor(user: User): NavEntry[] {
  const shared: NavEntry[] = [
    { to: '/ranking', label: 'Ranking', icon: LuMedal },
    { to: '/galera', label: 'Palpites da galera', icon: LuUsers },
  ]
  return user.role === 'PLAYER'
    ? [{ to: '/palpites', label: 'Meus palpites', icon: LuListChecks, status: <PredictionsStatusIcon /> }, ...shared]
    : [...shared, { to: '/admin', label: 'Painel do admin', icon: LuSettings }]
}

function NavItem({ to, status, children }: { to: string; status?: ReactNode; children: string }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Text
          display="inline-flex"
          alignItems="center"
          gap="1.5"
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="0.15em"
          textTransform="uppercase"
          color={isActive ? 'gold.fg' : 'fg.muted'}
          _hover={{ color: 'fg' }}
          borderBottomWidth="2px"
          borderColor={isActive ? 'gold.solid' : 'transparent'}
          py="1"
          whiteSpace="nowrap"
        >
          {status}
          {children}
        </Text>
      )}
    </NavLink>
  )
}

function UserMenu({ user, items }: { user: User; items: NavEntry[] }) {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <Button variant="ghost" colorPalette="gray" size="sm" px="2" textTransform="none" letterSpacing="normal" aria-label="Menu do usuário">
          <Avatar.Root size="xs" colorPalette="gold" variant="solid">
            <Avatar.Fallback name={user.name} />
          </Avatar.Root>
          <Text display={{ base: 'none', sm: 'block' }} maxW="32" truncate>
            {user.name.split(' ')[0]}
          </Text>
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56" bg="bg.panel">
            <Box px="2" py="1.5">
              <Text fontWeight="semibold" fontSize="sm">
                {user.name}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {user.email}
              </Text>
            </Box>
            <Menu.Separator />
            {items.map((item) => (
              <Menu.Item key={item.to} value={item.to} asChild>
                <RouterLink to={item.to}>
                  <Icon as={item.icon} />
                  {item.label}
                  {item.status && (
                    <Box as="span" display="inline-flex" ms="auto">
                      {item.status}
                    </Box>
                  )}
                </RouterLink>
              </Menu.Item>
            ))}
            {items.length > 0 && <Menu.Separator />}
            {!user.mustChangePassword && (
              <Menu.Item value="/trocar-senha" asChild>
                <RouterLink to="/trocar-senha">
                  <LuKeyRound />
                  Alterar senha
                </RouterLink>
              </Menu.Item>
            )}
            <Menu.Item
              value="logout"
              color="fg.error"
              _hover={{ bg: 'bg.error', color: 'fg.error' }}
              onSelect={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}
            >
              <LuLogOut />
              Sair
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

const CHANGE_PASSWORD_PATH = '/trocar-senha'

export function AppLayout() {
  const { data: user } = useMe()
  const { pathname } = useLocation()
  // Entrou com senha temporária: só sai da tela de troca depois de escolher a nova
  const mustChangePassword = user?.mustChangePassword ?? false
  const items = user && !mustChangePassword ? navFor(user) : []

  if (mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  return (
    <Flex direction="column" minH="100dvh">
      <Box as="header" borderBottomWidth="1px" borderColor="border" bg="bg">
        <Container maxW="6xl" py="2.5">
          <HStack justify="space-between" gap="4">
            <RouterLink to="/" aria-label="Página inicial">
              <HStack gap="2">
                <Icon as={LuTrophy} color="gold.solid" boxSize="5" />
                <Text fontFamily="heading" fontWeight="600" fontSize="lg" letterSpacing="0.08em" whiteSpace="nowrap">
                  BOLÃO <Box as="span" color="gold.fg">TGA</Box>
                </Text>
              </HStack>
            </RouterLink>

            {user && (
              <HStack gap={{ base: '2', md: '6' }}>
                {/* No celular, a navegação fica dentro do menu do usuário */}
                <HStack as="nav" gap="6" display={{ base: 'none', md: 'flex' }}>
                  {items.map((item) => (
                    <NavItem key={item.to} to={item.to} status={item.status}>
                      {item.label}
                    </NavItem>
                  ))}
                </HStack>
                <UserMenu user={user} items={items} />
              </HStack>
            )}
          </HStack>
        </Container>
      </Box>

      <Box as="main" flex="1">
        <Outlet />
      </Box>

      <Box as="footer" borderTopWidth="1px" borderColor="border" py="4">
        <Container maxW="6xl">
          <Text fontSize="xs" color="fg.subtle" textAlign="center">
            Bolão entre amigos · sem vínculo oficial com The Game Awards
          </Text>
        </Container>
      </Box>
    </Flex>
  )
}
