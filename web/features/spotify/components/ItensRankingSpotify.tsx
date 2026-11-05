import { Avatar, Box, Center, Flex, HStack, Heading, Text, VStack } from '@chakra-ui/react'
import { ExternalLink, Music2 } from 'lucide-react'
import { memo } from 'react'
import type { ItemRankingArtista, ItemRankingMusica } from '../types'
import { formatarMinutosParaHorasEMinutos } from '../utils'

export interface ItemRankingFaixaProps {
  item: ItemRankingMusica
  corPosicao?: string
}

export const ItemRankingFaixa = memo(function ItemRankingFaixa({
  item,
  corPosicao = 'cirqueira.spotify.amarelo',
}: ItemRankingFaixaProps) {
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
          {item.imagemUrl ? (
            <Box
              as="img"
              src={item.imagemUrl}
              alt={item.nomeFaixa}
              w="full"
              h="full"
              objectFit="cover"
            />
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
}

export const ItemRankingArtistaLinha = memo(function ItemRankingArtistaLinha({
  item,
  corPosicao = 'cirqueira.spotify.azul',
}: ItemRankingArtistaProps) {
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

        <Avatar.Root
          size="md"
          shape="full"
          flexShrink={0}
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
        >
          {item.imagemUrl && <Avatar.Image src={item.imagemUrl} alt={item.nomeArtista} />}
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

      <VStack align="flex-end" gap={0} flexShrink={0}>
        <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.verde">
          {formatarMinutosParaHorasEMinutos(item.totalMinutos)}
        </Text>
      </VStack>
    </Flex>
  )
})
