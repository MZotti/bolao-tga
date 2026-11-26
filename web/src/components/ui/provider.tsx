"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { system } from "@/theme/system"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

// Snippet gerado pela CLI do Chakra, alterado para usar o tema do bolão
// (src/theme/system.ts) em vez do defaultSystem.
export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
