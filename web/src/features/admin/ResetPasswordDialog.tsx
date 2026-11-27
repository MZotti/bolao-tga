import { Alert, Button, Clipboard, CloseButton, Code, Dialog, Field, HStack, IconButton, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { LuKeyRound, LuRefreshCw } from 'react-icons/lu'
import { z } from 'zod'
import type { User } from '@/features/auth/types'
import { useResetPassword } from './api'

// Sem caracteres que se confundem (l/1, o/0), fácil de digitar no celular
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

/** Senha temporária aleatória no formato "abcd-efgh-jkmn" (~59 bits). */
function generateTempPassword(): string {
  const chars: string[] = []
  // Descarta bytes acima do maior múltiplo do alfabeto, para não favorecer letras
  const limit = 256 - (256 % ALPHABET.length)
  while (chars.length < 12) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < limit && chars.length < 12) chars.push(ALPHABET[byte % ALPHABET.length])
    }
  }
  return [0, 4, 8].map((i) => chars.slice(i, i + 4).join('')).join('-')
}

// Mesmas regras da API (api/src/users/dto/reset-password.dto.ts)
const resetSchema = z.object({
  password: z.string().trim().min(8, 'Mínimo de 8 caracteres').max(200, 'Senha longa demais'),
})
type ResetForm = z.infer<typeof resetSchema>

/**
 * Botão + diálogo para o admin definir uma senha temporária.
 * Já sugere uma senha aleatória; depois de salvar, mostra a senha para copiar
 * e mandar para a pessoa.
 */
export function ResetPasswordDialog({ user }: { user: User }) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  // Senha que acabou de ser definida (mostrada na etapa de "pronto")
  const [savedPassword, setSavedPassword] = useState<string | null>(null)
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '' },
  })

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      // Cada abertura começa do zero, com uma senha nova sugerida
      reset({ password: generateTempPassword() })
      setSavedPassword(null)
      resetPassword.reset()
    }
  }

  const onSubmit = handleSubmit(({ password }) => {
    resetPassword.mutate({ userId: user.id, password }, { onSuccess: () => setSavedPassword(password) })
  })

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} placement="center">
      <Dialog.Trigger asChild>
        <Button size="xs" variant="outline" colorPalette="gray" textTransform="none" letterSpacing="normal">
          <LuKeyRound /> Redefinir senha
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner px="4">
          <Dialog.Content bg="bg.panel">
            <Dialog.Header>
              <Dialog.Title>Redefinir senha</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {savedPassword ? (
                <Stack gap="4">
                  <Alert.Root status="success" variant="subtle">
                    <Alert.Indicator />
                    <Alert.Title>Senha de {user.name} redefinida</Alert.Title>
                  </Alert.Root>
                  <Text fontSize="sm" color="fg.muted">
                    Envie esta senha temporária para {user.name}. No próximo login, vai ser pedido para escolher uma
                    senha nova.
                  </Text>
                  <Clipboard.Root value={savedPassword}>
                    <HStack gap="2" bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="md" px="3" py="2">
                      <Code flex="1" bg="transparent" fontSize="md" letterSpacing="0.05em">
                        {savedPassword}
                      </Code>
                      <Clipboard.Trigger asChild>
                        <Button size="xs" variant="outline" colorPalette="gray" textTransform="none" letterSpacing="normal">
                          <Clipboard.Indicator />
                          <Clipboard.CopyText />
                        </Button>
                      </Clipboard.Trigger>
                    </HStack>
                  </Clipboard.Root>
                </Stack>
              ) : (
                <form id={formId} onSubmit={onSubmit} noValidate>
                  <Stack gap="4">
                    <Text fontSize="sm" color="fg.muted">
                      {user.name} ({user.email}) vai entrar com esta senha temporária e escolher uma nova em seguida.
                      As sessões abertas de {user.name} serão encerradas.
                    </Text>

                    {resetPassword.isError && (
                      <Alert.Root status="error" variant="subtle">
                        <Alert.Indicator />
                        <Alert.Title>{resetPassword.error.message}</Alert.Title>
                      </Alert.Root>
                    )}

                    <Field.Root invalid={!!errors.password}>
                      <Field.Label>Senha temporária</Field.Label>
                      <HStack w="full" gap="2">
                        <Input fontFamily="mono" autoComplete="off" spellCheck={false} {...register('password')} />
                        <IconButton
                          variant="outline"
                          colorPalette="gray"
                          aria-label="Gerar outra senha"
                          title="Gerar outra senha"
                          onClick={() => setValue('password', generateTempPassword(), { shouldValidate: true })}
                        >
                          <LuRefreshCw />
                        </IconButton>
                      </HStack>
                      <Field.HelperText>Sugerida automaticamente. Você pode trocar por outra.</Field.HelperText>
                      <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                    </Field.Root>
                  </Stack>
                </form>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {savedPassword ? (
                <Dialog.ActionTrigger asChild>
                  <Button>Fechar</Button>
                </Dialog.ActionTrigger>
              ) : (
                <>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="ghost" colorPalette="gray">
                      Cancelar
                    </Button>
                  </Dialog.ActionTrigger>
                  <Button type="submit" form={formId} loading={resetPassword.isPending}>
                    Redefinir senha
                  </Button>
                </>
              )}
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
