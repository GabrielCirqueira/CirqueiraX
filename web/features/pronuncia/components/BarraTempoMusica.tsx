import { useMountEffect } from '@/shared/hooks'
import { Box, HStack, Text } from '@chakra-ui/react'
import { memo, useState } from 'react'
import { posicaoAtualMs } from '../hooks'
import type { TocandoAgoraPronuncia } from '../types'
import { formatarTempoMusica } from '../utils'

const INTERVALO_ATUALIZACAO_MS = 500

export interface BarraTempoMusicaProps {
  tocando: TocandoAgoraPronuncia
}

export const BarraTempoMusica = memo(function BarraTempoMusica({ tocando }: BarraTempoMusicaProps) {
  const [, setAgora] = useState(() => Date.now())

  useMountEffect(() => {
    const intervalo = window.setInterval(() => setAgora(Date.now()), INTERVALO_ATUALIZACAO_MS)
    return () => window.clearInterval(intervalo)
  })

  const posicao = posicaoAtualMs(tocando, 0)
  const percentual = tocando.duracaoMs > 0 ? (posicao / tocando.duracaoMs) * 100 : 0

  return (
    <Box>
      <Box h="4px" bg="bg.muted" borderRadius="full" overflow="hidden">
        <Box
          h="full"
          bg="cirqueira.musica.verde"
          borderRadius="full"
          w={`${percentual}%`}
          transition="width 0.5s linear"
        />
      </Box>
      <HStack
        justify="space-between"
        mt={1}
        fontSize="2xs"
        color="fg.subtle"
        fontVariantNumeric="tabular-nums"
      >
        <Text>{formatarTempoMusica(posicao)}</Text>
        <Text>{formatarTempoMusica(tocando.duracaoMs)}</Text>
      </HStack>
    </Box>
  )
})
