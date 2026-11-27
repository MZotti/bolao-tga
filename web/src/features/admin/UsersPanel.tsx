import { Alert, Badge, Box, Button, Code, Field, Heading, Input, NativeSelect, SimpleGrid, Stack, Table, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { PasswordInput } from '@/components/ui/password-input'
import { useMe } from '@/features/auth/api'
import { useProgress } from '@/features/leaderboard/api'
import { isApiError } from '@/lib/api'
import { useCreateUser, useUsers } from './api'
import { ResetPasswordDialog } from './ResetPasswordDialog'

const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(50, 'Use no máximo 50 caracteres'),
  email: z.string().trim().min(1, 'Informe o e-mail').pipe(z.email('E-mail inválido')),
  password: z.string().min(8, 'Mínimo de 8 caracteres').max(200),
  role: z.enum(['PLAYER', 'ADMIN']),
})
type CreateUserFormInput = z.input<typeof createUserSchema>
type CreateUserFormOutput = z.output<typeof createUserSchema>

export function UsersPanel() {
  return (
    <Stack gap="8">
      <UsersTable />
      <InviteHint />
      <CreateUserForm />
    </Stack>
  )
}

function UsersTable() {
  const users = useUsers()
  const progress = useProgress()
  const { data: me } = useMe()

  if (users.isPending) return <PageSpinner />
  if (users.isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{users.error.message}</Alert.Title>
      </Alert.Root>
    )
  }

  const filledById = new Map(progress.data?.map((p) => [p.userId, p]) ?? [])

  return (
    <Stack gap="3">
      <Heading size="md">Participantes ({users.data.filter((u) => u.role === 'PLAYER').length})</Heading>
      <Table.ScrollArea borderWidth="1px" borderColor="border" borderRadius="md">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>Nome</Table.ColumnHeader>
              <Table.ColumnHeader>E-mail</Table.ColumnHeader>
              <Table.ColumnHeader>Tipo</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Palpites</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Senha</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.data.map((user) => {
              const p = filledById.get(user.id)
              return (
                <Table.Row key={user.id} bg="bg.panel">
                  <Table.Cell fontWeight="semibold">
                    {user.name}
                    {user.mustChangePassword && (
                      <Badge size="sm" colorPalette="orange" variant="subtle" ms="2" title="Ainda não escolheu uma senha própria">
                        senha temporária
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{user.email}</Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant={user.role === 'ADMIN' ? 'solid' : 'outline'} colorPalette={user.role === 'ADMIN' ? 'gold' : 'gray'}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Player'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {p ? `${p.filled}/${p.total}` : '—'}
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    {/* A própria senha se troca pelo menu ("Alterar senha") */}
                    {user.id === me?.id ? (
                      <Text as="span" fontSize="xs" color="fg.subtle">
                        você
                      </Text>
                    ) : (
                      <ResetPasswordDialog user={user} />
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  )
}

function InviteHint() {
  const link = `${window.location.origin}/cadastro?convite=`
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="md" p="4">
      <Stack gap="2">
        <Heading size="sm">Convidar pelo link</Heading>
        <Text fontSize="sm" color="fg.muted">
          Mande este link no grupo, completando com o código definido em <Code size="sm">SIGNUP_CODE</Code> no
          .env do servidor. A pessoa cria a própria conta e já entra como player:
        </Text>
        <Code size="sm" p="2" wordBreak="break-all">
          {link}SEU_CODIGO
        </Code>
      </Stack>
    </Box>
  )
}

function CreateUserForm() {
  const createUser = useCreateUser()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserFormInput, unknown, CreateUserFormOutput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'PLAYER' },
  })

  const onSubmit = handleSubmit((values) => {
    createUser.mutate(values, {
      onSuccess: () => reset(),
      onError: (error) => {
        if (isApiError(error, 409)) setError('email', { message: 'Este e-mail já está cadastrado' })
      },
    })
  })

  const otherError = createUser.isError && !isApiError(createUser.error, 409)

  return (
    <Stack gap="3">
      <Heading size="md">Cadastrar manualmente</Heading>
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="md" p="5">
        <form onSubmit={onSubmit} noValidate>
          <Stack gap="4">
            {otherError && (
              <Alert.Root status="error" variant="subtle">
                <Alert.Indicator />
                <Alert.Title>{createUser.error?.message}</Alert.Title>
              </Alert.Root>
            )}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              <Field.Root invalid={!!errors.name}>
                <Field.Label>Nome</Field.Label>
                <Input autoComplete="off" {...register('name')} />
                <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.email}>
                <Field.Label>E-mail</Field.Label>
                <Input type="email" autoComplete="off" {...register('email')} />
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.password}>
                <Field.Label>Senha inicial</Field.Label>
                <PasswordInput autoComplete="new-password" {...register('password')} />
                <Field.HelperText>A pessoa escolhe uma senha própria no primeiro login.</Field.HelperText>
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.role}>
                <Field.Label>Tipo</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field {...register('role')}>
                    <option value="PLAYER">Player (faz palpites)</option>
                    <option value="ADMIN">Admin (gerencia o bolão)</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </SimpleGrid>
            <Box>
              <Button type="submit" loading={createUser.isPending}>
                Cadastrar
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Stack>
  )
}
