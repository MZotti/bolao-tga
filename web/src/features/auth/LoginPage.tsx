import { Alert, Button, Field, Input, Link, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, Link as RouterLink, useLocation, useNavigate, type Location } from 'react-router'
import { z } from 'zod'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { PasswordInput } from '@/components/ui/password-input'
import { useLogin, useMe } from './api'
import { AuthCard } from './AuthCard'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail').pipe(z.email('E-mail inválido')),
  password: z.string().min(1, 'Informe sua senha'),
})

type LoginFormInput = z.input<typeof loginSchema>
type LoginFormOutput = z.output<typeof loginSchema>

export function LoginPage() {
  const { data: user, isPending: checkingSession } = useMe()
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  // Página que o usuário tentou abrir antes de ser mandado para o login
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (checkingSession) return <PageSpinner />
  // Já logado (ex.: abriu /login de novo): não faz sentido mostrar o formulário
  if (user && !login.isSuccess) return <Navigate to={from} replace />

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => navigate(from, { replace: true }) })
  })

  return (
    <AuthCard
      title="Entrar"
      footer={
        <>
          Não tem conta?{' '}
          <Link asChild color="gold.fg" fontWeight="semibold">
            <RouterLink to="/cadastro">Criar conta</RouterLink>
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="5">
          {login.isError && (
            <Alert.Root status="error" variant="subtle">
              <Alert.Indicator />
              <Alert.Title>{login.error.message}</Alert.Title>
            </Alert.Root>
          )}

          <Field.Root invalid={!!errors.email}>
            <Field.Label>E-mail</Field.Label>
            <Input type="email" autoComplete="email" inputMode="email" autoFocus {...register('email')} />
            <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.password}>
            <Field.Label>Senha</Field.Label>
            <PasswordInput autoComplete="current-password" {...register('password')} />
            <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
          </Field.Root>

          <Button type="submit" size="lg" loading={login.isPending} loadingText="Entrando">
            Entrar
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
