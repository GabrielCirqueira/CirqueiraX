import { Box, Button, Center, Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { ChevronRight, ExternalLink, Music2 } from 'lucide-react'
import { memo, useState } from 'react'
import type { PeriodoMusicasItem } from '../api'
import { useMusicasItem } from '../hooks'
import type { ItemTopMusicaArtista } from '../types'
import { urlCapaExibicao } from '../utils/capaMusica'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { MinutosMusica } from './MinutosMusica'
import { ModalMusicasItem } from './ModalMusicasItem'

const QUANTIDADE_PREVIA = 5

export interface ListaMusicasItemProps {
  artista: string
  artistaUuid?: string | null
  album?: string | null
  periodo?: PeriodoMusicasItem | null
  rotuloPeriodo?: string
  aberto: boolean
}

export const ListaMusicasItem = memo(function ListaMusicasItem({
  artista,
  artistaUuid,
  album,
  periodo,
  rotuloPeriodo,
  aberto,
}: ListaMusicasItemProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const {
    data: musicas,
    isLoading,
    isError,
  } = useMusicasItem(
    { artista, artistaUuid, album, periodo, limite: QUANTIDADE_PREVIA + 1 },
    aberto
  )

  if (isLoading) {
    return (
      <VStack gap={1.5} align="stretch" pt={2} pb={1} w="full">
        <Skeleton h="36px" borderRadius="6px" />
        <Skeleton h="36px" borderRadius="6px" />
        <Skeleton h="36px" borderRadius="6px" />
      </VStack>
    )
  }

  if (isError || !musicas || musicas.length === 0) {
    return (
      <Box py={2} textAlign="center" w="full">
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          Nenhuma música encontrada no período.
        </Text>
      </Box>
    )
  }

  const temMais = musicas.length > QUANTIDADE_PREVIA

  return (
    <VStack gap={1.5} align="stretch" pt={2} pb={1} w="full">
      {musicas.slice(0, QUANTIDADE_PREVIA).map((musica, indice) => (
        <LinhaMusicaItemSpotify
          key={`${musica.nomeFaixa}-${musica.codigoFaixa ?? indice}`}
          musica={musica}
          posicao={indice + 1}
        />
      ))}

      {temMais && (
        <Button
          variant="ghost"
          size="xs"
          w="full"
          borderRadius="6px"
          justifyContent="space-between"
          color="cirqueira.musica.textoSecundario"
          _hover={{
            color: 'cirqueira.musica.textoPrincipal',
            bg: 'cirqueira.musica.cartaoElevado',
          }}
          onClick={() => setModalAberto(true)}
        >
          <Text as="span" fontSize="xs" fontWeight="semibold">
            Ver todas as músicas
          </Text>
          <ChevronRight size={14} />
        </Button>
      )}

      {modalAberto && (
        <ModalMusicasItem
          aberto={modalAberto}
          onFechar={() => setModalAberto(false)}
          artista={artista}
          artistaUuid={artistaUuid}
          album={album}
          periodo={periodo}
          rotuloPeriodo={rotuloPeriodo}
        />
      )}
    </VStack>
  )
})

export interface LinhaMusicaItemSpotifyProps {
  musica: ItemTopMusicaArtista
  posicao: number
}

export const LinhaMusicaItemSpotify = memo(function LinhaMusicaItemSpotify({
  musica,
  posicao,
}: LinhaMusicaItemSpotifyProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      p={{ base: 1.5, sm: 2 }}
      borderRadius="6px"
      bg="blackAlpha.400"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      gap={{ base: 2, sm: 2.5 }}
      w="full"
      minW={0}
    >
      <HStack gap={{ base: 2, sm: 2.5 }} flex={1} minW={0} align="center">
        <Center
          minW={5}
          fontSize="2xs"
          fontWeight="bold"
          color="cirqueira.musica.textoSecundario"
          flexShrink={0}
        >
          {posicao}
        </Center>

        <Box
          boxSize={{ base: 7, sm: 8 }}
          borderRadius="4px"
          overflow="hidden"
          bg="cirqueira.musica.cartaoElevado"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {musica.imagemUrl ? (
            <img
              referrerPolicy="no-referrer"
              src={urlCapaExibicao(musica.imagemUrl) ?? undefined}
              alt={musica.nomeFaixa}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Music2 size={14} color="var(--chakra-colors-cirqueira-musica-textoDesabilitado)" />
          )}
        </Box>

        <VStack align="flex-start" gap={0} minW={0} flex={1}>
          <HStack gap={1.5} maxW="full">
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="cirqueira.musica.textoPrincipal"
              truncate
            >
              {musica.nomeFaixa}
            </Text>
            {musica.urlSpotify && (
              <a
                href={musica.urlSpotify}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', flexShrink: 0 }}
              >
                <Box
                  as="span"
                  color="cirqueira.musica.textoSecundario"
                  _hover={{ color: 'cirqueira.musica.verde' }}
                  display="inline-flex"
                >
                  <ExternalLink size={10} />
                </Box>
              </a>
            )}
          </HStack>
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
            {musica.album}
          </Text>
          <DivisaoFontesMusica porFonte={musica.porFonte} />
        </VStack>
      </HStack>

      <VStack align="flex-end" gap={0} flexShrink={0}>
        <Text fontSize={{ base: '2xs', sm: 'xs' }} fontWeight="bold" color="cirqueira.musica.verde">
          <MinutosMusica
            minutos={musica.totalMinutos}
            porFonte={musica.porFonte}
            estimado={musica.estimado}
          />
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
          {musica.totalStreams} {musica.totalStreams === 1 ? 'stream' : 'streams'}
        </Text>
      </VStack>
    </Flex>
  )
})
