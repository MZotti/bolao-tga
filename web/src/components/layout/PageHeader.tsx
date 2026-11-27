import { Heading, Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  eyebrow?: string
}

/** Título padrão das páginas: "sobretítulo" dourado + título condensado. */
export function PageHeader({ title, description, eyebrow = 'THE GAME AWARDS 2026' }: PageHeaderProps) {
  return (
    <Stack gap="2">
      <Text color="gold.fg" fontSize="xs" fontWeight="semibold" letterSpacing="0.3em">
        {eyebrow}
      </Text>
      <Heading as="h1" size={{ base: '3xl', md: '4xl' }}>
        {title}
      </Heading>
      {description && <Text color="fg.muted">{description}</Text>}
    </Stack>
  )
}
