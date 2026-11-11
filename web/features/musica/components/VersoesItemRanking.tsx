import { Skeleton, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { PeriodoMusicasItem } from '../api'
import { useVersoesMusica } from '../hooks'
import { ListaComponentesMashup, ListaVersoesMusica } from './ListaVersoesMusica'

export interface VersoesItemRankingProps {
  musicaUuid: string | null | undefined
  periodo: PeriodoMusicasItem | null
  aberto: boolean
}

export const VersoesItemRanking = memo(function VersoesItemRanking({
  musicaUuid,
  periodo,
  aberto,
}: VersoesItemRankingProps) {
  const { data, isLoading, isError } = useVersoesMusica(musicaUuid, periodo, aberto)

  if (isLoading) {
    return (
      <VStack gap={1.5} align="stretch">
        <Skeleton h="36px" borderRadius="6px" />
        <Skeleton h="36px" borderRadius="6px" />
      </VStack>
    )
  }

  if (isError || !data) {
    return (
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
        Não foi possível carregar as versões.
      </Text>
    )
  }

  return (
    <VStack align="stretch" gap={3}>
      {data.mashup && data.componentes.length > 0 && (
        <VStack align="stretch" gap={1.5}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            textTransform="uppercase"
            color="cirqueira.musica.textoSecundario"
          >
            Contém
          </Text>
          <ListaComponentesMashup componentes={data.componentes} artistas={data.artistas} />
        </VStack>
      )}
      <VStack align="stretch" gap={1.5}>
        <Text
          fontSize="2xs"
          fontWeight="bold"
          textTransform="uppercase"
          color="cirqueira.musica.textoSecundario"
        >
          Versões ouvidas neste período
        </Text>
        <ListaVersoesMusica variantes={data.variantes} />
      </VStack>
    </VStack>
  )
})
