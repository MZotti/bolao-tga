import { Center, Spinner } from '@chakra-ui/react'

export function PageSpinner() {
  return (
    <Center py="24">
      <Spinner size="lg" color="gold.solid" />
    </Center>
  )
}
