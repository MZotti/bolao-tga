import { Alert, Button, Field, Input, Link, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, Link as RouterLink, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { PasswordInput } from '@/components/ui/password-input'
import { isApiError } from '@/lib/api'
import { useMe, useRegister } from './api'
import { AuthCard } from './AuthCard'

// Mesmas regras da API (api/src/users/dto/create-user.dto.ts)
const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe seu nome').max(50, 'Use no máximo 50 caracteres'),
    email: z.string().trim().min(1, 'Informe seu e-mail').pipe(z.email('E-mail inválido')),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .max(200, 'Senha longa demais'),
    confirmPassword: z.string().min(1, 'Repita a senha'),
    inviteCode: z.string().trim().min(1, 'Informe o código de convite'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type RegisterFormInput = z.input<typeof registerSchema>
type RegisterFormOutput = z.output<typeof registerSchema>

export function RegisterPage() {
  const { data: user, isPending: checkingSession } = useMe()
  const registerUser = useRegister()
  const navigate = useNavigate()
  // Permite compartilhar um link pronto: /cadastro?convite=CODIGO
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      inviteCode: searchParams.get('convite') ?? '',
    },
  })

  if (checkingSession) return <PageSpinner />
  if (user && !registerUser.isSuccess) return <Navigate to="/" replace />

  const onSubmit = handleSubmit(({ name, email, password, inviteCode }) => {
    registerUser.mutate(
      { name, email, password, inviteCode },
      {
        onSuccess: () => navigate('/palpites', { replace: true }),
        // Erros que pertencem a um campo aparecem embaixo dele
        onError: (error) => {
          if (isApiError(error, 409)) setError('email', { message: 'Este e-mail já está cadastrado' })
          else if (isApiError(error, 403) && /convite/i.test(error.message))
            setError('inviteCode', { message: 'Código de convite inválido' })
        },
      },
    )
  })

  // Erros de campo já aparecem no próprio campo; o alerta fica para o resto
  const fieldError =
    isApiError(registerUser.error, 409) ||
    (isApiError(registerUser.error, 403) && /convite/i.test(registerUser.error.message))
  const showAlert = registerUser.isError && !fieldError

  return (
    <AuthCard
      title="Criar conta"
      footer={
        <>
          Já tem conta?{' '}
          <Link asChild color="gold.fg" fontWeight="semibold">
            <RouterLink to="/login">Entrar</RouterLink>
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="5">
          {showAlert && (
            <Alert.Root status="error" variant="subtle">
              <Alert.Indicator />
              <Alert.Title>{registerUser.error?.message}</Alert.Title>
            </Alert.Root>
          )}

          <Field.Root invalid={!!errors.name}>
            <Field.Label>Nome</Field.Label>
            <Input autoComplete="name" autoFocus {...register('name')} />
            <Field.HelperText>É o nome que aparece no ranking.</Field.HelperText>
            <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.email}>
            <Field.Label>E-mail</Field.Label>
            <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
            <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.password}>
            <Field.Label>Senha</Field.Label>
            <PasswordInput autoComplete="new-password" {...register('password')} />
            <Field.HelperText>Mínimo de 8 caracteres.</Field.HelperText>
            <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.confirmPassword}>
            <Field.Label>Confirmar senha</Field.Label>
            <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
            <Field.ErrorText>{errors.confirmPassword?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.inviteCode}>
            <Field.Label>Código de convite</Field.Label>
            <Input autoComplete="off" autoCapitalize="none" spellCheck={false} {...register('inviteCode')} />
            <Field.HelperText>Peça para quem organiza o bolão.</Field.HelperText>
            <Field.ErrorText>{errors.inviteCode?.message}</Field.ErrorText>
          </Field.Root>

          <Button type="submit" size="lg" loading={registerUser.isPending} loadingText="Criando conta">
            Criar conta
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
