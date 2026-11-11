import {
  Avatar,
  Badge,
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
import type { PeriodoMusicasItem } from '../api'
import type { AlbumAnalise, ItemRankingArtista, ItemRankingMusica } from '../types'
import { gerarRotaArtista, gerarRotaMusica } from '../utils'
import { CapaMusica } from './CapaMusica'
import { GrupoIconesFonte } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'
import { ListaMusicasItem } from './ListaMusicasItem'
import { MinutosMusica } from './MinutosMusica'
import { VersoesItemRanking } from './VersoesItemRanking'

export interface ItemRankingFaixaProps {
  item: ItemRankingMusica
  corPosicao?: string
  imagemUrlResolvida?: string | null
  periodo?: PeriodoMusicasItem | null
}

export const ItemRankingFaixa = memo(function ItemRankingFaixa({
  item,
  corPosicao = 'cirqueira.musica.amarelo',
  imagemUrlResolvida,
  periodo = null,
}: ItemRankingFaixaProps) {
  const [expandido, setExpandido] = useState(false)
  const foto = item.imagemUrl || imagemUrlResolvida
  const expansivel = Boolean(item.musicaUuid)
  const linkExterno = item.urlSpotify ?? item.urlYoutubeMusic ?? null

  return (
    <Collapsible.Root open={expandido} unmountOnExit>
      <Box
        borderRadius="8px"
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor={expandido ? 'cirqueira.musica.amarelo' : 'border.subtle'}
        transition="border-color 0.15s ease"
        overflow="hidden"
        w="full"
        minW={0}
      >
        <Flex
          align="center"
          justify="space-between"
          p={{ base: 2, sm: 2.5 }}
          cursor={expansivel ? 'pointer' : 'default'}
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="background-color 0.15s ease"
          onClick={() => expansivel && setExpandido((anterior) => !anterior)}
          gap={{ base: 2, sm: 3 }}
          w="full"
          minW={0}
        >
          <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
            <Center
              boxSize={{ base: 6, sm: 7 }}
              borderRadius="8px"
              fontWeight="black"
              fontSize={{ base: 'xs', sm: 'sm' }}
              color={corPosicao}
              flexShrink={0}
            >
              {item.posicao}
            </Center>

            <Box
              boxSize={{ base: 10, sm: 11 }}
              borderRadius="6px"
              overflow="hidden"
              border="1px solid"
              borderColor="border.subtle"
              bg="cirqueira.musica.cartaoElevado"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {foto ? (
                <Box as="img" src={foto} alt={item.nomeFaixa} w="full" h="full" objectFit="cover" />
              ) : (
                <Music2 size={16} color="var(--chakra-colors-cirqueira-musica-textoDesabilitado)" />
              )}
            </Box>

            <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
              <HStack gap={1.5} maxW="full">
                <Link
                  asChild
                  fontSize={{ base: 'xs', sm: 'sm' }}
                  fontWeight="semibold"
                  color="cirqueira.musica.textoPrincipal"
                  truncate
                  display="block"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <LinkMusica
                    to={gerarRotaMusica(item.nomeFaixa, item.artistaPrincipal, item.musicaUuid)}
                  >
                    {item.nomeFaixa}
                  </LinkMusica>
                </Link>
                {item.mashup && (
                  <Badge
                    size="xs"
                    variant="subtle"
                    bg="cirqueira.musica.cartaoElevado"
                    color="cirqueira.musica.azul"
                    flexShrink={0}
                  >
                    Mashup
                  </Badge>
                )}
                {linkExterno && (
                  <Box
                    as="a"
                    href={linkExterno}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="cirqueira.musica.textoSecundario"
                    _hover={{ color: 'cirqueira.musica.verde' }}
                    flexShrink={0}
                    onClick={(evento) => evento.stopPropagation()}
                    display="inline-flex"
                    alignItems="center"
                  >
                    <ExternalLink size={12} />
                  </Box>
                )}
              </HStack>
              <HStack gap={1.5} maxW="full" minW={0}>
                <GrupoIconesFonte fontes={item.fontes} tamanho={11} />
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                  {(item.artistas ?? [item.artistaPrincipal]).join(', ')}
                  {item.album ? ` • ${item.album}` : ''}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack gap={{ base: 1.5, sm: 2 }} flexShrink={0} align="center">
            <VStack align="flex-end" gap={0}>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.musica.verde"
              >
                <MinutosMusica
                  minutos={item.totalMinutos}
                  porFonte={item.porFonte}
                  estimado={item.estimado}
                />
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                {item.totalStreams} {item.totalStreams === 1 ? 'stream' : 'streams'}
              </Text>
            </VStack>
            {expansivel && (
              <Box
                color="cirqueira.musica.textoSecundario"
                transition="transform 0.2s ease"
                transform={expandido ? 'rotate(180deg)' : 'none'}
              >
                <ChevronDown size={16} />
              </Box>
            )}
          </HStack>
        </Flex>

        <Collapsible.Content>
          <Box
            px={{ base: 2, sm: 3 }}
            pb={{ base: 2, sm: 3 }}
            pt={2}
            borderTop="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <VersoesItemRanking musicaUuid={item.musicaUuid} periodo={periodo} aberto={expandido} />
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  )
})

export interface ItemRankingArtistaProps {
  item: ItemRankingArtista
  corPosicao?: string
  periodo?: PeriodoMusicasItem | null
  rotuloPeriodo?: string
  imagemUrlResolvida?: string | null
}

export const ItemRankingArtistaLinha = memo(function ItemRankingArtistaLinha({
  item,
  corPosicao = 'cirqueira.musica.azul',
  periodo,
  rotuloPeriodo,
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
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor={expandido ? 'cirqueira.musica.azul' : 'border.subtle'}
        transition="border-color 0.15s ease, background-color 0.15s ease"
        overflow="hidden"
        w="full"
        minW={0}
      >
        <Flex
          align="center"
          justify="space-between"
          p={{ base: 2, sm: 2.5 }}
          cursor="pointer"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          onClick={() => setExpandido((prev) => !prev)}
          gap={{ base: 2, sm: 3 }}
          w="full"
          minW={0}
        >
          <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
            <Center
              boxSize={{ base: 6, sm: 7 }}
              borderRadius="8px"
              fontWeight="black"
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
              borderColor="border.subtle"
              bg="cirqueira.musica.cartaoElevado"
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
                    bg="cirqueira.musica.cartaoElevado"
                    color="cirqueira.musica.textoSecundario"
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
                  color="cirqueira.musica.textoPrincipal"
                  truncate
                  display="block"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkMusica to={gerarRotaArtista(item.nomeArtista, item.artistaUuid)}>
                    {item.nomeArtista}
                  </LinkMusica>
                </Link>
                {item.urlSpotify && (
                  <Box
                    as="a"
                    href={item.urlSpotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="cirqueira.musica.textoSecundario"
                    _hover={{ color: 'cirqueira.musica.verde' }}
                    flexShrink={0}
                    onClick={(e) => e.stopPropagation()}
                    display="inline-flex"
                    alignItems="center"
                  >
                    <ExternalLink size={12} />
                  </Box>
                )}
              </HStack>
              <HStack gap={1.5}>
                <GrupoIconesFonte fontes={item.fontes} tamanho={11} />
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                  {item.totalStreams} reproduções
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack gap={{ base: 1.5, sm: 2 }} flexShrink={0} align="center">
            <VStack align="flex-end" gap={0}>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.musica.verde"
              >
                <MinutosMusica
                  minutos={item.totalMinutos}
                  porFonte={item.porFonte}
                  estimado={item.estimado}
                />
              </Text>
            </VStack>
            <Box
              color="cirqueira.musica.textoSecundario"
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
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <ListaMusicasItem
              artista={item.nomeArtista}
              artistaUuid={item.artistaUuid}
              periodo={periodo}
              rotuloPeriodo={rotuloPeriodo}
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
  periodo?: PeriodoMusicasItem | null
  rotuloPeriodo?: string
}

export const ItemRankingAlbum = memo(function ItemRankingAlbum({
  item,
  posicao,
  imagemUrl,
  periodo,
  rotuloPeriodo,
}: ItemRankingAlbumProps) {
  const [expandido, setExpandido] = useState(false)

  return (
    <Collapsible.Root open={expandido} unmountOnExit>
      <Box
        borderRadius="8px"
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor={expandido ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
        transition="border-color 0.15s ease"
        overflow="hidden"
        w="full"
        minW={0}
      >
        <Flex
          align="center"
          justify="space-between"
          p={{ base: 2, sm: 3 }}
          cursor="pointer"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          transition="background-color 0.15s ease"
          onClick={() => setExpandido((anterior) => !anterior)}
          gap={{ base: 2, sm: 3 }}
          w="full"
          minW={0}
        >
          <HStack gap={{ base: 2, sm: 3 }} flex={1} minW={0} align="center">
            <Center
              boxSize={{ base: 6, sm: 8 }}
              fontWeight="bold"
              fontSize={{ base: 'xs', sm: 'sm' }}
              color="cirqueira.musica.verde"
              flexShrink={0}
            >
              {posicao}
            </Center>
            <CapaMusica
              url={imagemUrl}
              alt={item.album}
              tipo="album"
              boxSize={{ base: 10, sm: 12 }}
            />
            <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="semibold"
                color="cirqueira.musica.textoPrincipal"
                truncate
                maxW="full"
              >
                {item.album}
              </Text>
              <Link
                asChild
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                truncate
                display="block"
                maxW="full"
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={(evento) => evento.stopPropagation()}
              >
                <LinkMusica to={gerarRotaArtista(item.artista)}>
                  {item.artista} • {item.faixasDistintas}{' '}
                  {item.faixasDistintas === 1 ? 'faixa' : 'faixas'}
                </LinkMusica>
              </Link>
            </VStack>
          </HStack>
          <HStack gap={{ base: 1.5, sm: 2 }} flexShrink={0} align="center">
            <VStack align="flex-end" gap={0}>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="bold"
                color="cirqueira.musica.verde"
              >
                <MinutosMusica minutos={item.minutos} />
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                {item.streams} {item.streams === 1 ? 'stream' : 'streams'}
              </Text>
            </VStack>
            <Box
              color="cirqueira.musica.textoSecundario"
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
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <ListaMusicasItem
              artista={item.artista}
              album={item.album}
              periodo={periodo}
              rotuloPeriodo={rotuloPeriodo}
              aberto={expandido}
            />
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  )
})
