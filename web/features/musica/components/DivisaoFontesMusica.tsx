import { HStack, Text } from '@chakra-ui/react'
import { memo } from 'react'
import { useFonteMusica } from '../hooks/useFonteMusica'
import type { PorFonte } from '../types'
import { formatarMinutos, listarParcelasPorFonte } from '../utils'
import { IconeFonteMusica } from './IconeFonteMusica'

export interface DivisaoFontesMusicaProps {
  porFonte: PorFonte | undefined
}

export const DivisaoFontesMusica = memo(function DivisaoFontesMusica({
  porFonte,
}: DivisaoFontesMusicaProps) {
  const { fonte } = useFonteMusica()
  const parcelas = listarParcelasPorFonte(porFonte)

  if (fonte !== 'todas' || parcelas.length === 0) return null

  return (
    <HStack gap={3} wrap="wrap" minW={0}>
      {parcelas.map((parcela) => (
        <HStack key={parcela.fonte} gap={1} flexShrink={0}>
          <IconeFonteMusica fonte={parcela.fonte} tamanho={11} />
          <Text
            fontSize="2xs"
            color="cirqueira.musica.textoSecundario"
            fontVariantNumeric="tabular-nums"
          >
            {formatarMinutos(parcela.minutos)}
          </Text>
        </HStack>
      ))}
    </HStack>
  )
})
