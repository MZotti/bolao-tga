import { Box, Button, Container, Heading, HStack, Icon, Skeleton, Stack, Text } from '@chakra-ui/react'
import { LuCalendar, LuClock } from 'react-icons/lu'
import { Link as RouterLink } from 'react-router'
import { EVENT, formatBrasilia } from '@/config/event'
import { useMe } from '@/features/auth/api'

const ceremonyDate = formatBrasilia(EVENT.ceremonyAt, { day: 'numeric', month: 'long' })
const ceremonyTime = formatBrasilia(EVENT.ceremonyAt, { hour: '2-digit', minute: '2-digit' })

export function HomePage() {
  const { data: user, isPending } = useMe()

  return (
    <Box
      position="relative"
      overflow="hidden"
      minH={{ base: 'calc(100dvh - 120px)', md: 'calc(100dvh - 130px)' }}
      display="flex"
      alignItems="center"
      // Brilho dourado sutil vindo do topo, como um holofote de palco
      bgImage="radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212, 175, 55, 0.22), transparent 70%)"
    >
      <Container maxW="4xl" py={{ base: '16', md: '24' }}>
        <Stack gap={{ base: '8', md: '10' }} align="center" textAlign="center">
          <Text
            color="gold.fg"
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="semibold"
            letterSpacing="0.4em"
            textTransform="uppercase"
          >
            {EVENT.name}
          </Text>

          <Stack gap="4" align="center">
            <Heading
              as="h1"
              fontSize={{ base: '7xl', md: '9xl' }}
              fontWeight="700"
              letterSpacing="0.01em"
              // Gradiente metálico no título, lembrando a estatueta
              bgImage="linear-gradient(180deg, #FFFFFF 0%, #F5EBC6 45%, #D4AF37 100%)"
              bgClip="text"
              color="transparent"
            >
              Bolão
            </Heading>
            <Box w="16" h="2px" bg="gold.solid" />
          </Stack>

          <Text fontSize={{ base: 'md', md: 'xl' }} color="fg.muted" maxW="xl">
            Escolha seus vencedores nas {EVENT.categoriesCount} categorias e descubra quem
            entende mais de games na noite da premiação.
          </Text>

          <HStack
            gap={{ base: '4', md: '8' }}
            color="fg.muted"
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="0.15em"
            flexWrap="wrap"
            justify="center"
          >
            <HStack gap="2">
              <Icon as={LuCalendar} color="gold.solid" />
              <Text>{ceremonyDate}</Text>
            </HStack>
            <HStack gap="2">
              <Icon as={LuClock} color="gold.solid" />
              <Text>{ceremonyTime} (Brasília)</Text>
            </HStack>
          </HStack>

          {isPending ? (
            <Skeleton h="14" w="48" />
          ) : user ? (
            <Stack gap="5" align="center">
              <Stack gap="1" align="center">
                <Text fontSize="sm" color="fg.subtle" textTransform="uppercase" letterSpacing="0.2em">
                  Você está dentro
                </Text>
                <Heading size="2xl">Olá, {user.name.split(' ')[0]}!</Heading>
              </Stack>
              <Stack direction={{ base: 'column', sm: 'row' }} gap="3" w={{ base: 'full', sm: 'auto' }}>
                {user.role === 'PLAYER' ? (
                  <Button asChild size="xl" px="10">
                    <RouterLink to="/palpites">Fazer meus palpites</RouterLink>
                  </Button>
                ) : (
                  <Button asChild size="xl" px="10">
                    <RouterLink to="/admin">Painel do admin</RouterLink>
                  </Button>
                )}
                <Button asChild size="xl" px="10" variant="outline">
                  <RouterLink to="/ranking">Ver ranking</RouterLink>
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack direction={{ base: 'column', sm: 'row' }} gap="3" w={{ base: 'full', sm: 'auto' }}>
              <Button asChild size="xl" px="12">
                <RouterLink to="/login">Entrar</RouterLink>
              </Button>
              <Button asChild size="xl" px="10" variant="outline">
                <RouterLink to="/cadastro">Criar conta</RouterLink>
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
