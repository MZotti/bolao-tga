import { Box, Card, Heading, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  children: ReactNode
  footer?: ReactNode
}

/** Moldura comum das telas de login e cadastro. */
export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <Box display="flex" justifyContent="center" px="4" py={{ base: '10', md: '16' }}>
      <Card.Root w="full" maxW="sm" bg="bg.panel" borderColor="border">
        <Card.Header gap="2">
          <Text color="gold.fg" fontSize="xs" fontWeight="semibold" letterSpacing="0.3em">
            BOLÃO TGA 2026
          </Text>
          <Heading size="3xl">{title}</Heading>
        </Card.Header>
        <Card.Body>{children}</Card.Body>
        {footer && (
          <Card.Footer justifyContent="center" borderTopWidth="1px" borderColor="border" pt="4">
            <Text fontSize="sm" color="fg.muted">
              {footer}
            </Text>
          </Card.Footer>
        )}
      </Card.Root>
    </Box>
  )
}
