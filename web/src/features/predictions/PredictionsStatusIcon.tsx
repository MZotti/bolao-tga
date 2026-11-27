import { Icon } from '@chakra-ui/react'
import { LuCircleCheck, LuTriangleAlert } from 'react-icons/lu'
import { Tooltip } from '@/components/ui/tooltip'
import { useSettings } from '@/features/settings/api'
import { useCategories } from './api'

/**
 * Indicador ao lado de "Meus palpites" (só para players):
 * - alerta: ainda falta palpitar em alguma categoria (enquanto os palpites estão abertos);
 * - check: todas as categorias preenchidas.
 *
 * Usa a mesma query da tela de palpites, que é atualizada na hora a cada
 * escolha, então o ícone muda assim que o último palpite é marcado.
 */
export function PredictionsStatusIcon() {
  const categories = useCategories()
  const { data: settings } = useSettings()

  if (!categories.data || !settings) return null

  const total = categories.data.length
  const missing = categories.data.filter((c) => c.myNomineeId === null).length

  if (missing === 0) {
    return (
      <Tooltip content="Todos os palpites feitos" openDelay={300}>
        <Icon as={LuCircleCheck} color="fg.success" boxSize="3.5" flexShrink="0" role="img" aria-label="Todos os palpites feitos" />
      </Tooltip>
    )
  }

  // Depois do encerramento não dá mais para completar: o alerta só incomodaria
  if (settings.locked) return null

  const label = missing === 1 ? 'Falta 1 palpite' : `Faltam ${missing} de ${total} palpites`
  return (
    <Tooltip content={label} openDelay={300}>
      <Icon as={LuTriangleAlert} color="fg.warning" boxSize="3.5" flexShrink="0" role="img" aria-label={label} />
    </Tooltip>
  )
}
