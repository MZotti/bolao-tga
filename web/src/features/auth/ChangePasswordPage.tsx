import { Alert, Button, Field, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { PasswordInput } from '@/components/ui/password-input'
import { toaster } from '@/components/ui/toaster'
import { isApiError } from '@/lib/api'
import { useChangePassword, useMe } from './api'
import { AuthCard } from './AuthCard'

// Mesmas regras da API (api/src/auth/dto/change-password.dto.ts)
function passwordSchema(requireCurrent: boolean) {
  return z
    .object({
      currentPassword: z.string(),
      newPassword: z
        .string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres')
        .max(200, 'Senha longa demais'),
      confirmPassword: z.string().min(1, 'Repita a nova senha'),
    })
    .superRefine((data, ctx) => {
      if (requireCurrent && !data.currentPassword) {
        ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe sua senha atual' })
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não conferem' })
      }
    })
}

type PasswordForm = z.infer<ReturnType<typeof passwordSchema>>

/**
 * /trocar-senha
 * - Obrigatória: depois que o admin define uma senha temporária, a pessoa cai
 *   aqui ao entrar (ver AppLayout) e só escolhe a nova senha.
 * - Voluntária: pelo menu do usuário, pedindo a senha atual.
 */
export function ChangePasswordPage() {
  const { data: user } = useMe()
  const changePassword = useChangePassword()
  const navigate = useNavigate()
  // A rota fica dentro de RequireAuth, então o usuário existe aqui
  const forced = user?.mustChangePassword ?? false

  const schema = useMemo(() => passwordSchema(!forced), [forced])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) => {
    changePassword.mutate(
      { newPassword, ...(forced ? {} : { currentPassword }) },
      {
        onSuccess: () => {
          toaster.create({ type: 'success', title: 'Senha alterada', description: 'Use a nova senha nos próximos logins.' })
          navigate('/', { replace: true })
        },
        // Erros que pertencem a um campo aparecem embaixo dele
        onError: (error) => {
          if (!isApiError(error, 400)) return
          if (/atual/i.test(error.message)) setError('currentPassword', { message: error.message })
          else if (/diferente/i.test(error.message)) setError('newPassword', { message: error.message })
        },
      },
    )
  })

  const fieldError = isApiError(changePassword.error, 400) && /atual|diferente/i.test(changePassword.error.message)
  const showAlert = changePassword.isError && !fieldError

  return (
    <AuthCard title={forced ? 'Escolha sua senha' : 'Alterar senha'}>
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="5">
          {forced && (
            <Alert.Root status="info" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Você entrou com uma senha temporária</Alert.Title>
                <Alert.Description>Para continuar, escolha uma senha só sua.</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {showAlert && (
            <Alert.Root status="error" variant="subtle">
              <Alert.Indicator />
              <Alert.Title>{changePassword.error?.message}</Alert.Title>
            </Alert.Root>
          )}

          {!forced && (
            <Field.Root invalid={!!errors.currentPassword}>
              <Field.Label>Senha atual</Field.Label>
              <PasswordInput autoComplete="current-password" autoFocus {...register('currentPassword')} />
              <Field.ErrorText>{errors.currentPassword?.message}</Field.ErrorText>
            </Field.Root>
          )}

          <Field.Root invalid={!!errors.newPassword}>
            <Field.Label>Nova senha</Field.Label>
            <PasswordInput autoComplete="new-password" autoFocus={forced} {...register('newPassword')} />
            <Field.HelperText>Mínimo de 8 caracteres.</Field.HelperText>
            <Field.ErrorText>{errors.newPassword?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.confirmPassword}>
            <Field.Label>Confirmar nova senha</Field.Label>
            <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
            <Field.ErrorText>{errors.confirmPassword?.message}</Field.ErrorText>
          </Field.Root>

          <Stack gap="2">
            <Button type="submit" size="lg" loading={changePassword.isPending} loadingText="Salvando">
              Salvar senha
            </Button>
            {!forced && (
              <Button variant="ghost" colorPalette="gray" onClick={() => navigate('/')}>
                Cancelar
              </Button>
            )}
          </Stack>
        </Stack>
      </form>
    </AuthCard>
  )
}
