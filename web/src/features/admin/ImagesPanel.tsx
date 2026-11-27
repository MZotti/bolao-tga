import { Alert, Box, Button, Field, HStack, Input, InputGroup, SegmentGroup, Stack, Text } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { LuSearch, LuTrash2 } from 'react-icons/lu'
import { z } from 'zod'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useCategories } from '@/features/predictions/api'
import { NomineeImage } from '@/features/predictions/NomineeImage'
import { useUpdateNomineeImage } from './api'

/** Um nome de indicado, com todas as categorias em que ele concorre. */
interface NomineeGroup {
  name: string
  /** Qualquer um dos ids: a API aplica a imagem a todos com o mesmo nome */
  nomineeId: string
  imageUrl: string | null
  categories: string[]
}

type Filter = 'all' | 'missing'

const filterItems = [
  { value: 'all', label: 'Todos' },
  { value: 'missing', label: 'Sem imagem' },
]

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/** Ignora maiúsculas e acentos na busca ("pokemon" acha "Pokémon"). */
const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Cadastro das imagens dos indicados, agrupados por nome: o mesmo jogo
 * concorre em várias categorias, e a imagem vale para todas elas.
 */
export function ImagesPanel() {
  const categories = useCategories()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  // Ao escolher "Sem imagem", congela a lista: o indicado que acabou de
  // receber imagem não some da tela na hora
  const [missingSnapshot, setMissingSnapshot] = useState<Set<string>>(new Set())

  const groups = useMemo(() => {
    const byName = new Map<string, NomineeGroup>()
    for (const category of categories.data ?? []) {
      for (const nominee of category.nominees) {
        const group = byName.get(nominee.name)
        if (group) {
          group.categories.push(category.name)
          group.imageUrl ??= nominee.imageUrl
        } else {
          byName.set(nominee.name, {
            name: nominee.name,
            nomineeId: nominee.id,
            imageUrl: nominee.imageUrl,
            categories: [category.name],
          })
        }
      }
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [categories.data])

  if (categories.isPending) return <PageSpinner />
  if (categories.isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{categories.error.message}</Alert.Title>
      </Alert.Root>
    )
  }

  const withImage = groups.filter((g) => g.imageUrl).length

  const changeFilter = (value: Filter) => {
    if (value === 'missing') setMissingSnapshot(new Set(groups.filter((g) => !g.imageUrl).map((g) => g.name)))
    setFilter(value)
  }

  const term = normalize(search.trim())
  const visible = groups.filter(
    (g) =>
      (filter === 'all' || missingSnapshot.has(g.name)) &&
      (!term || normalize(g.name).includes(term) || g.categories.some((c) => normalize(c).includes(term))),
  )

  return (
    <Stack gap="5">
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="md" p="4">
        <Stack gap="1.5" fontSize="sm" color="fg.muted">
          <Text>
            Cole o link <b>https</b> de uma imagem. Ela aparece em todas as categorias em que o indicado concorre.
          </Text>
          <Text>
            Prefira imagens horizontais (16:9), como as capas da Steam ou imagens de divulgação. Para pegar o link: clique
            com o botão direito na imagem → <i>Copiar endereço da imagem</i>.
          </Text>
        </Stack>
      </Box>

      <HStack justify="space-between" gap="3" flexWrap="wrap">
        <InputGroup startElement={<LuSearch />} maxW={{ base: 'full', sm: 'xs' }}>
          <Input placeholder="Buscar indicado ou categoria" value={search} onChange={(e) => setSearch(e.target.value)} />
        </InputGroup>
        <HStack gap="3">
          <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
            {withImage}/{groups.length} com imagem
          </Text>
          <SegmentGroup.Root value={filter} onValueChange={({ value }) => value && changeFilter(value as Filter)} size="sm">
            <SegmentGroup.Indicator />
            <SegmentGroup.Items items={filterItems} />
          </SegmentGroup.Root>
        </HStack>
      </HStack>

      {visible.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" textAlign="center" py="8">
          {filter === 'missing' && !term ? 'Todos os indicados têm imagem 🎉' : 'Nenhum indicado encontrado.'}
        </Text>
      ) : (
        <Stack gap="3">
          {visible.map((group) => (
            <ImageRow key={group.name} group={group} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

const imageSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .max(2048, 'Link longo demais')
    .refine((v) => v === '' || isHttpsUrl(v), 'Use um link que comece com https://'),
})
type ImageForm = z.infer<typeof imageSchema>

function ImageRow({ group }: { group: NomineeGroup }) {
  const updateImage = useUpdateNomineeImage()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<ImageForm>({
    resolver: zodResolver(imageSchema),
    // values (e não defaultValues): se a imagem mudar no cache, o campo acompanha
    values: { imageUrl: group.imageUrl ?? '' },
  })

  // Pré-visualização enquanto digita (só quando já é um link https válido)
  const typed = (useWatch({ control, name: 'imageUrl' }) ?? '').trim()
  const preview = isHttpsUrl(typed) ? typed : null

  const save = (imageUrl: string | null) =>
    updateImage.mutate({ nomineeId: group.nomineeId, imageUrl }, { onSuccess: () => reset({ imageUrl: imageUrl ?? '' }) })

  // Campo vazio = remover a imagem
  const onSubmit = handleSubmit(({ imageUrl }) => save(imageUrl || null))

  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="md" p="3">
      <Stack direction={{ base: 'column', md: 'row' }} gap="4" align={{ base: 'stretch', md: 'center' }}>
        <NomineeImage src={preview} w={{ base: 'full', md: '40' }} borderRadius="sm" />

        <Stack gap="3" flex="1" minW="0">
          <Stack gap="0.5">
            <Text fontWeight="semibold">{group.name}</Text>
            <Text fontSize="xs" color="fg.muted">
              {group.categories.length > 1 ? `${group.categories.length} categorias: ` : ''}
              {group.categories.join(' · ')}
            </Text>
          </Stack>

          <form onSubmit={onSubmit} noValidate>
            <Field.Root invalid={!!errors.imageUrl}>
              <HStack w="full" gap="2">
                <Input
                  size="sm"
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Link da imagem de ${group.name}`}
                  {...register('imageUrl')}
                />
                <Button type="submit" size="sm" disabled={!isDirty} loading={updateImage.isPending}>
                  Salvar
                </Button>
                {group.imageUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="gray"
                    aria-label={`Remover a imagem de ${group.name}`}
                    title="Remover imagem"
                    onClick={() => save(null)}
                    disabled={updateImage.isPending}
                  >
                    <LuTrash2 />
                  </Button>
                )}
              </HStack>
              <Field.ErrorText>{errors.imageUrl?.message}</Field.ErrorText>
            </Field.Root>
          </form>
        </Stack>
      </Stack>
    </Box>
  )
}
