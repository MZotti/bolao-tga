import { Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router'

export function NotFoundPage() {
  return (
    <Container maxW="md" py="24">
      <Stack gap="6" align="center" textAlign="center">
        <Text color="gold.fg" fontSize="sm" letterSpacing="0.4em">
          ERRO 404
        </Text>
        <Heading size="4xl">Página não encontrada</Heading>
        <Text color="fg.muted">O endereço que você tentou abrir não existe.</Text>
        <Button asChild variant="outline">
          <RouterLink to="/">Voltar ao início</RouterLink>
        </Button>
      </Stack>
    </Container>
  )
}
