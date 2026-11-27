import { Alert, Button, Field, Input, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { PasswordInput } from '@/components/ui/password-input'
import { toaster } from '@/components/ui/toaster'
import { isApiError } from '@/lib/api'
import { useMe, useUpdateProfile } from './api'
import { AuthCard } from './AuthCard'

// Mesma normalização da API (api/src/common/normalize.ts)
const normalizeEmail = (email: string) => email.trim().toLowerCase()

// Mesmas regras da API (api/src/auth/dto/update-profile.dto.ts)
function profileSchema(currentEmail: string) {
  return z
    .object({
      name: z.string().trim().min(1, 'Informe seu nome').max(50, 'Use no máximo 50 caracteres'),
      email: z.string().trim().min(1, 'Informe seu e-mail').pipe(z.email('E-mail inválido')),
      currentPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (normalizeEmail(data.email) !== currentEmail && !data.currentPassword) {
        ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe sua senha atual' })
      }
    })
}

type ProfileForm = z.infer<ReturnType<typeof profileSchema>>

/** /meus-dados: a pessoa altera o próprio nome e e-mail (pelo menu do usuário). */
export function ProfilePage() {
  const { data: user } = useMe()
  const updateProfile = useUpdateProfile()
  const navigate = useNavigate()
  // A rota fica dentro de RequireAuth, então o usuário existe aqui
  const currentEmail = user?.email ?? ''

  const schema = useMemo(() => profileSchema(currentEmail), [currentEmail])
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', email: currentEmail, currentPassword: '' },
  })

  // O e-mail é o login da conta: trocar pede a senha atual
  const typedEmail = useWatch({ control, name: 'email' }) ?? ''
  const emailChanged = normalizeEmail(typedEmail) !== currentEmail

  const onSubmit = handleSubmit(({ name, email, currentPassword }) => {
    updateProfile.mutate(
      { name, email, ...(emailChanged ? { currentPassword } : {}) },
      {
        onSuccess: () => {
          toaster.create({
            type: 'success',
            title: 'Dados atualizados',
            description: emailChanged ? 'Use o novo e-mail nos próximos logins.' : undefined,
          })
          navigate('/', { replace: true })
        },
        // Erros que pertencem a um campo aparecem embaixo dele
        onError: (error) => {
          if (isApiError(error, 409)) setError('email', { message: error.message })
          else if (isApiError(error, 400) && /senha/i.test(error.message)) {
            setError('currentPassword', { message: error.message })
          }
        },
      },
    )
  })

  const fieldError =
    isApiError(updateProfile.error, 409) ||
    (isApiError(updateProfile.error, 400) && /senha/i.test(updateProfile.error.message))
  const showAlert = updateProfile.isError && !fieldError

  return (
    <AuthCard title="Meus dados">
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="5">
          {showAlert && (
            <Alert.Root status="error" variant="subtle">
              <Alert.Indicator />
              <Alert.Title>{updateProfile.error?.message}</Alert.Title>
            </Alert.Root>
          )}

          <Field.Root invalid={!!errors.name}>
            <Field.Label>Nome</Field.Label>
            <Input autoComplete="name" autoFocus {...register('name')} />
            <Field.HelperText>É como você aparece no ranking e nos palpites da galera.</Field.HelperText>
            <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.email}>
            <Field.Label>E-mail</Field.Label>
            <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
            <Field.HelperText>Usado para entrar no bolão.</Field.HelperText>
            <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
          </Field.Root>

          {emailChanged && (
            <Field.Root invalid={!!errors.currentPassword}>
              <Field.Label>Senha atual</Field.Label>
              <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
              <Field.HelperText>Para trocar o e-mail, confirme sua senha.</Field.HelperText>
              <Field.ErrorText>{errors.currentPassword?.message}</Field.ErrorText>
            </Field.Root>
          )}

          <Stack gap="2">
            <Button
              type="submit"
              size="lg"
              disabled={!isDirty}
              loading={updateProfile.isPending}
              loadingText="Salvando"
            >
              Salvar
            </Button>
            <Button variant="ghost" colorPalette="gray" onClick={() => navigate('/')}>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </form>
    </AuthCard>
  )
}
