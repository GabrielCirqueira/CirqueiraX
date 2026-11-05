import { Avatar, Box, Center, Collapsible, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { ChevronDown, ExternalLink, Music2 } from 'lucide-react'
import { memo, useState } from 'react'
import type { ItemRankingArtista, ItemRankingMusica } from '../types'
import { formatarMinutosParaHorasEMinutos } from '../utils'
import { ListaTopMusicasArtista } from './ListaTopMusicasArtista'

export interface ItemRankingFaixaProps {
  item: ItemRankingMusica
  corPosicao?: string
  imagemUrlResolvida?: string | null
}

export const ItemRankingFaixa = memo(function ItemRankingFaixa({
  item,
  corPosicao = 'cirqueira.spotify.amarelo',
  imagemUrlResolvida,
}: ItemRankingFaixaProps) {
  const foto = item.imagemUrl || imagemUrlResolvida

  return (
    <Flex
      align="center"
      justify="space-between"
      p={3}
      borderRadius="8px"
      bg="cirqueira.spotify.cartao"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
      transition="background-color 0.15s ease"
      gap={3}
    >
      <HStack gap={3} flex={1} minW={0} align="center">
        <Center
          boxSize={8}
          borderRadius="md"
          fontWeight="bold"
          fontSize="sm"
          color={corPosicao}
          flexShrink={0}
        >
          {item.posicao}
        </Center>

        <Box
          boxSize={12}
          borderRadius="4px"
          overflow="hidden"
          bg="cirqueira.spotify.cartaoElevado"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {foto ? (
            <Box as="img" src={foto} alt={item.nomeFaixa} w="full" h="full" objectFit="cover" />
          ) : (
            <Music2 size={20} color="var(--chakra-colors-cirqueira-spotify-textoDesabilitado)" />
          )}
        </Box>

        <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
          <HStack gap={2} maxW="full">
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="cirqueira.spotify.textoPrincipal"
              truncate
            >
              {item.nomeFaixa}
            </Text>
            {item.urlSpotify && (
              <Box
                as="a"
                href={item.urlSpotify}
                target="_blank"
                rel="noopener noreferrer"
                color="cirqueira.spotify.textoSecundario"
                _hover={{ color: 'cirqueira.spotify.verde' }}
                flexShrink={0}
              >
                <ExternalLink size={12} />
              </Box>
            )}
          </HStack>
          <Text fontSize="xs" color="cirqueira.spotify.textoSecundario" truncate>
            {item.artistaPrincipal} • {item.album}
          </Text>
        </VStack>
      </HStack>

      <VStack align="flex-end" gap={0} flexShrink={0}>
        <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.verde">
          {formatarMinutosParaHorasEMinutos(item.totalMinutos)}
        </Text>
        <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
          {item.totalStreams} {item.totalStreams === 1 ? 'stream' : 'streams'}
        </Text>
      </VStack>
    </Flex>
  )
})

export interface ItemRankingArtistaProps {
  item: ItemRankingArtista
  corPosicao?: string
  ano?: number | null
  mes?: number | null
  imagemUrlResolvida?: string | null
}

export const ItemRankingArtistaLinha = memo(function ItemRankingArtistaLinha({
  item,
  corPosicao = 'cirqueira.spotify.azul',
  ano,
  mes,
  imagemUrlResolvida,
}: ItemRankingArtistaProps) {
  const [expandido, setExpandido] = useState(false)
  const foto = item.imagemUrl || imagemUrlResolvida

  return (
    <Collapsible.Root open={expandido} unmountOnExit>
      <Box
        borderRadius="8px"
        bg="cirqueira.spotify.cartao"
        border="1px solid"
        borderColor={expandido ? 'cirqueira.spotify.azul' : 'cirqueira.spotify.cartaoElevado'}
        transition="border-color 0.15s ease, background-color 0.15s ease"
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="space-between"
          p={3}
          cursor="pointer"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          onClick={() => setExpandido((prev) => !prev)}
          gap={3}
        >
          <HStack gap={3} flex={1} minW={0} align="center">
            <Center
              boxSize={8}
              borderRadius="md"
              fontWeight="bold"
              fontSize="sm"
              color={corPosicao}
              flexShrink={0}
            >
              {item.posicao}
            </Center>

            <Avatar.Root
              size="md"
              shape="full"
              flexShrink={0}
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
            >
              {foto && <Avatar.Image src={foto} alt={item.nomeArtista} />}
              <Avatar.Fallback
                name={item.nomeArtista}
                bg="cirqueira.spotify.cartaoElevado"
                color="cirqueira.spotify.azul"
              />
            </Avatar.Root>

            <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
              <HStack gap={2} maxW="full">
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="cirqueira.spotify.textoPrincipal"
                  truncate
                >
                  {item.nomeArtista}
                </Text>
                {item.urlSpotify && (
                  <Box
                    as="a"
                    href={item.urlSpotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="cirqueira.spotify.textoSecundario"
                    _hover={{ color: 'cirqueira.spotify.verde' }}
                    flexShrink={0}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                  </Box>
                )}
              </HStack>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                {item.totalStreams} reproduções
              </Text>
            </VStack>
          </HStack>

          <HStack gap={2} flexShrink={0} align="center">
            <VStack align="flex-end" gap={0}>
              <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.verde">
                {formatarMinutosParaHorasEMinutos(item.totalMinutos)}
              </Text>
            </VStack>
            <Box
              color="cirqueira.spotify.textoSecundario"
              transition="transform 0.2s ease"
              transform={expandido ? 'rotate(180deg)' : 'none'}
            >
              <ChevronDown size={16} />
            </Box>
          </HStack>
        </Flex>

        <Collapsible.Content>
          <Box
            px={3}
            pb={3}
            pt={1}
            borderTop="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
          >
            <ListaTopMusicasArtista
              artista={item.nomeArtista}
              ano={ano}
              mes={mes}
              aberto={expandido}
            />
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  )
})
