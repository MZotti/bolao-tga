import { Box, HStack, Text } from '@chakra-ui/react'

/** Selo "AO VIVO" com ponto pulsando, usado durante a cerimônia. */
export function LiveBadge() {
  return (
    <HStack gap="2" color="red.fg" fontSize="xs" fontWeight="bold" letterSpacing="0.2em">
      <Box position="relative" boxSize="2">
        <Box position="absolute" inset="0" borderRadius="full" bg="red.solid" animation="ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" />
        <Box position="absolute" inset="0" borderRadius="full" bg="red.solid" />
      </Box>
      <Text>AO VIVO</Text>
    </HStack>
  )
}
