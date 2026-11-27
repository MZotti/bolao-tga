import { AspectRatio, type AspectRatioProps, Center, Icon, Image } from '@chakra-ui/react'
import { useState } from 'react'
import { LuGamepad2, LuImageOff } from 'react-icons/lu'

interface NomineeImageProps extends Omit<AspectRatioProps, 'children'> {
  src: string | null
}

/**
 * Imagem de um indicado, em proporção fixa (16:9 por padrão), cortada para
 * preencher o espaço. Sem imagem, ou se o link não carregar, mostra um ícone
 * no lugar, para os cards continuarem alinhados.
 */
export function NomineeImage({ src, ratio = 16 / 9, ...rest }: NomineeImageProps) {
  // Guarda QUAL link falhou: se o src mudar, tenta carregar o novo
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = src !== null && failedSrc === src

  return (
    <AspectRatio ratio={ratio} bg="bg.emphasized" overflow="hidden" flexShrink="0" {...rest}>
      {src && !failed ? (
        <Image
          src={src}
          // Decorativa: o nome do indicado já aparece em texto ao lado
          alt=""
          objectFit="cover"
          loading="lazy"
          // Alguns sites recusam imagens pedidas a partir de outro domínio
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Center color="fg.subtle" title={failed ? 'Não foi possível carregar a imagem' : undefined}>
          <Icon as={failed ? LuImageOff : LuGamepad2} boxSize="6" />
        </Center>
      )}
    </AspectRatio>
  )
}
