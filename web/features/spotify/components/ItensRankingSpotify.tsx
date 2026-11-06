import {
  Avatar,
  Box,
  Center,
  Collapsible,
  Flex,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ChevronDown, ExternalLink, Music2 } from 'lucide-react'
import { memo, useState } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import type { AlbumAnalise, ItemRankingArtista, ItemRankingMusica } from '../types'
import { formatarMinutosParaHorasEMinutos, gerarRotaArtista, gerarRotaMusica } from '../utils'
import { CapaSpotify } from './CapaSpotify'
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
      p={{ base: 2, sm: 3 }}
      borderRadius="8px"
      bg="cirqueira.spotify.cartao"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
      transition="background-color 0.15s ease"
      gap={{ base: 2, sm: 3 }}
      w="full"
      minW={0}
    >
      <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
        <Center
          boxSize={{ base: 6, sm: 8 }}
          borderRadius="md"
          fontWeight="bold"
          fontSize={{ base: 'xs', sm: 'sm' }}
          color={corPosicao}
          flexShrink={0}
        >
          {item.posicao}
        </Center>

        <Box
          boxSize={{ base: 10, sm: 12 }}
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
            <Music2 size={16} color="var(--chakra-colors-cirqueira-spotify-textoDesabilitado)" />
          )}
        </Box>

        <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
          <HStack gap={1.5} maxW="full">
            <Link
              asChild
              fontSize={{ base: 'xs', sm: 'sm' }}
              fontWeight="semibold"
              color="cirqueira.spotify.textoPrincipal"
              truncate
              display="block"
              _hover={{ textDecoration: 'underline' }}
            >
              <LinkRouter to={gerarRotaMusica(item.nomeFaixa, item.artistaPrincipal)}>
                {item.nomeFaixa}
              </LinkRouter>
            </Link>
            {item.urlSpotify && (
              <Box
                as="a"
                href={item.urlSpotify}
                target="_blank"
                rel="noopener noreferrer"
                color="cirqueira.spotify.textoSecundario"
                _hover={{ color: 'cirqueira.spotify.verde' }}
                flexShrink={0}
                display="inline-flex"
                alignItems="center"
              >
                <ExternalLink size={12} />
              </Box>
            )}
          </HStack>
          <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario" truncate maxW="full">
            {item.artistaPrincipal} • {item.album}
          </Text>
        </VStack>
      </HStack>

      <VStack align="flex-end" gap={0} flexShrink={0}>
        <Text fontSize={{ base: 'xs', sm: 'sm' }} fontWeight="bold" color="cirqueira.spotify.verde">
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
  const [urlComErro, setUrlComErro] = useState<string | null>(null)
  const foto = item.imagemUrl || imagemUrlResolvida
  const temFoto = Boolean(foto) && urlComErro !== foto

  return (
    <Collapsible.Root open={expandido} unmountOnExit>
      <Box
        borderRadius="8px"
        bg="cirqueira.spotify.cartao"
        border="1px solid"
        borderColor={expandido ? 'cirqueira.spotify.azul' : 'cirqueira.spotify.cartaoElevado'}
        transition="border-color 0.15s ease, background-color 0.15s ease"
        overflow="hidden"
        w="full"
        minW={0}
      >
        <Flex
          align="center"
          justify="space-between"
          p={{ base: 2, sm: 3 }}
          cursor="pointer"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          onClick={() => setExpandido((prev) => !prev)}
          gap={{ base: 2, sm: 3 }}
          w="full"
          minW={0}
        >
          <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
            <Center
              boxSize={{ base: 6, sm: 8 }}
              borderRadius="md"
              fontWeight="bold"
              fontSize={{ base: 'xs', sm: 'sm' }}
              color={corPosicao}
              flexShrink={0}
            >
              {item.posicao}
            </Center>

            <Box
              boxSize={{ base: 9, sm: 10 }}
              borderRadius="full"
              overflow="hidden"
              flexShrink={0}
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
              bg="cirqueira.spotify.cartaoElevado"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {temFoto ? (
                <Box
                  as="img"
                  src={foto as string}
                  alt={item.nomeArtista}
                  w="full"
                  h="full"
                  objectFit="cover"
                  onError={() => {
                    if (foto) setUrlComErro(foto)
                  }}
                />
              ) : (
                <Avatar.Root size="md" shape="full">
                  <Avatar.Fallback
                    name={item.nomeArtista}
                    bg="cirqueira.spotify.cartaoElevado"
                    color="cirqueira.spotify.azul"
                  />
                </Avatar.Root>
              )}
            </Box>

            <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
              <HStack gap={1.5} maxW="full">
                <Link
                  asChild
                  fontSize={{ base: 'xs', sm: 'sm' }}
                  fontWeight="semibold"
                  color="cirqueira.spotify.textoPrincipal"
                  truncate
                  display="block"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkRouter to={gerarRotaArtista(item.nomeArtista)}>
                    {item.nomeArtista}
                  </LinkRouter>
                </Link>
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
                    display="inline-flex"
                    alignItems="center"
                  >
                    <ExternalLink size={12} />
                  </Box>
                )}
              </HStack>
              <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                {item.totalStreams} reproduções
              </Text>
            </VStack>
          </HStack>

          <HStack gap={{ base: 1.5, sm: 2 }} flexShrink={0} align="center">
            <VStack align="flex-end" gap={0}>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.spotify.verde"
              >
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
            px={{ base: 2, sm: 3 }}
            pb={{ base: 2, sm: 3 }}
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

export interface ItemRankingAlbumProps {
  item: AlbumAnalise
  posicao: number
  imagemUrl: string | null
}

export const ItemRankingAlbum = memo(function ItemRankingAlbum({
  item,
  posicao,
  imagemUrl,
}: ItemRankingAlbumProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      p={{ base: 2, sm: 3 }}
      borderRadius="8px"
      bg="cirqueira.spotify.cartao"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
      transition="background-color 0.15s ease"
      gap={{ base: 2, sm: 3 }}
      w="full"
      minW={0}
    >
      <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
        <Center
          boxSize={{ base: 6, sm: 8 }}
          fontWeight="bold"
          fontSize={{ base: 'xs', sm: 'sm' }}
          color="cirqueira.spotify.verde"
          flexShrink={0}
        >
          {posicao}
        </Center>
        <CapaSpotify url={imagemUrl} alt={item.album} tipo="album" boxSize={{ base: 10, sm: 12 }} />
        <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
          <Text
            fontSize={{ base: 'xs', sm: 'sm' }}
            fontWeight="semibold"
            color="cirqueira.spotify.textoPrincipal"
            truncate
            maxW="full"
          >
            {item.album}
          </Text>
          <Link
            asChild
            fontSize="2xs"
            color="cirqueira.spotify.textoSecundario"
            truncate
            display="block"
            maxW="full"
            _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
          >
            <LinkRouter to={gerarRotaArtista(item.artista)}>
              {item.artista} • {item.faixasDistintas}{' '}
              {item.faixasDistintas === 1 ? 'faixa' : 'faixas'}
            </LinkRouter>
          </Link>
        </VStack>
      </HStack>
      <VStack align="flex-end" gap={0} flexShrink={0}>
        <Text fontSize={{ base: 'xs', sm: 'sm' }} fontWeight="bold" color="cirqueira.spotify.verde">
          {formatarMinutosParaHorasEMinutos(item.minutos)}
        </Text>
        <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
          {item.streams} {item.streams === 1 ? 'stream' : 'streams'}
        </Text>
      </VStack>
    </Flex>
  )
})
