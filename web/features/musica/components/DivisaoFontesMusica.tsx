import { HStack, Text } from '@chakra-ui/react'
import { memo } from 'react'
import { useFonteMusica } from '../hooks/useFonteMusica'
import type { PorFonte } from '../types'
import { ROTULOS_FONTE_REPRODUCAO, formatarMinutos, listarParcelasPorFonte } from '../utils'
import { IconeFonteMusica } from './IconeFonteMusica'

export interface DivisaoFontesMusicaProps {
  porFonte: PorFonte | undefined
  destaque?: boolean
  cor?: string
}

const ESTILO_NORMAL = { icone: 11, fonte: '2xs', gap: 3 } as const
const ESTILO_DESTAQUE = { icone: 16, fonte: 'sm', gap: 4 } as const

export const DivisaoFontesMusica = memo(function DivisaoFontesMusica({
  porFonte,
  destaque = false,
  cor = 'cirqueira.musica.textoSecundario',
}: DivisaoFontesMusicaProps) {
  const estilo = destaque ? ESTILO_DESTAQUE : ESTILO_NORMAL
  const { fonte } = useFonteMusica()
  const parcelas = listarParcelasPorFonte(porFonte)

  if (fonte !== 'todas' || parcelas.length === 0) return null

  return (
    <HStack gap={estilo.gap} wrap="wrap" minW={0}>
      {parcelas.map((parcela) => (
        <HStack key={parcela.fonte} gap={destaque ? 1.5 : 1} flexShrink={0}>
          <IconeFonteMusica fonte={parcela.fonte} tamanho={estilo.icone} />
          <Text
            fontSize={estilo.fonte}
            fontWeight={destaque ? 'semibold' : 'normal'}
            color={cor}
            fontVariantNumeric="tabular-nums"
          >
            {destaque ? `${ROTULOS_FONTE_REPRODUCAO[parcela.fonte]} · ` : ''}
            {formatarMinutos(parcela.minutos)}
          </Text>
        </HStack>
      ))}
    </HStack>
  )
})
