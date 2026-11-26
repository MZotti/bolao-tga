import { Avatar, Box, Button, Container, Flex, HStack, Icon, Menu, Portal, Text } from '@chakra-ui/react'
import type { IconType } from 'react-icons'
import { LuChevronDown, LuListChecks, LuLogOut, LuMedal, LuSettings, LuTrophy, LuUsers } from 'react-icons/lu'
import { NavLink, Link as RouterLink, Outlet, useNavigate } from 'react-router'
import { useLogout, useMe } from '@/features/auth/api'
import type { User } from '@/features/auth/types'

interface NavEntry {
  to: string
  label: string
  icon: IconType
}

/** Itens de navegação de cada tipo de usuário. */
function navFor(user: User): NavEntry[] {
  const shared: NavEntry[] = [
    { to: '/ranking', label: 'Ranking', icon: LuMedal },
    { to: '/galera', label: 'Palpites da galera', icon: LuUsers },
  ]
  return user.role === 'PLAYER'
    ? [{ to: '/palpites', label: 'Meus palpites', icon: LuListChecks }, ...shared]
    : [...shared, { to: '/admin', label: 'Painel do admin', icon: LuSettings }]
}

function NavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Text
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
                </RouterLink>
              </Menu.Item>
            ))}
            <Menu.Separator />
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

export function AppLayout() {
  const { data: user } = useMe()
  const items = user ? navFor(user) : []

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
                    <NavItem key={item.to} to={item.to}>
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
