import { Box, Center, Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { ExternalLink, Music2 } from 'lucide-react'
import { memo } from 'react'
import { useTopMusicasArtista } from '../hooks'
import { MinutosSpotify } from './MinutosSpotify'

export interface ListaTopMusicasArtistaProps {
  artista: string
  ano?: number | null
  mes?: number | null
  aberto: boolean
}

export const ListaTopMusicasArtista = memo(function ListaTopMusicasArtista({
  artista,
  ano,
  mes,
  aberto,
}: ListaTopMusicasArtistaProps) {
  const { data: musicas, isLoading, isError } = useTopMusicasArtista(artista, ano, mes, aberto)

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
        <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
          Nenhuma música encontrada para este artista.
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={1.5} align="stretch" pt={2} pb={1} w="full">
      {musicas.map((musica, indice) => (
        <Flex
          key={`${musica.nomeFaixa}-${musica.codigoFaixa ?? indice}`}
          align="center"
          justify="space-between"
          p={{ base: 1.5, sm: 2 }}
          borderRadius="6px"
          bg="rgba(0, 0, 0, 0.25)"
          border="1px solid"
          borderColor="cirqueira.spotify.cartaoElevado"
          gap={{ base: 2, sm: 2.5 }}
          w="full"
          minW={0}
        >
          <HStack gap={{ base: 2, sm: 2.5 }} flex={1} minW={0} align="center">
            <Center
              boxSize={5}
              fontSize="2xs"
              fontWeight="bold"
              color="cirqueira.spotify.textoSecundario"
              flexShrink={0}
            >
              {indice + 1}
            </Center>

            <Box
              boxSize={{ base: 7, sm: 8 }}
              borderRadius="4px"
              overflow="hidden"
              bg="cirqueira.spotify.cartaoElevado"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {musica.imagemUrl ? (
                <Box
                  as="img"
                  src={musica.imagemUrl}
                  alt={musica.nomeFaixa}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              ) : (
                <Music2
                  size={14}
                  color="var(--chakra-colors-cirqueira-spotify-textoDesabilitado)"
                />
              )}
            </Box>

            <VStack align="flex-start" gap={0} minW={0} flex={1}>
              <HStack gap={1.5} maxW="full">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="cirqueira.spotify.textoPrincipal"
                  truncate
                >
                  {musica.nomeFaixa}
                </Text>
                {musica.urlSpotify && (
                  <Box
                    as="a"
                    href={musica.urlSpotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="cirqueira.spotify.textoSecundario"
                    _hover={{ color: 'cirqueira.spotify.verde' }}
                    flexShrink={0}
                    display="inline-flex"
                    alignItems="center"
                  >
                    <ExternalLink size={10} />
                  </Box>
                )}
              </HStack>
              <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario" truncate maxW="full">
                {musica.album}
              </Text>
            </VStack>
          </HStack>

          <VStack align="flex-end" gap={0} flexShrink={0}>
            <Text
              fontSize={{ base: '2xs', sm: 'xs' }}
              fontWeight="bold"
              color="cirqueira.spotify.verde"
            >
              <MinutosSpotify minutos={musica.totalMinutos} />
            </Text>
            <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
              {musica.totalStreams} {musica.totalStreams === 1 ? 'stream' : 'streams'}
            </Text>
          </VStack>
        </Flex>
      ))}
    </VStack>
  )
})
