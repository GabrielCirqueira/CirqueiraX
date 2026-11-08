import { Box, Button, Flex, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { ExternalLink, Pause, Radio } from 'lucide-react'
import { memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import {
  useRelogioSpotify,
  useSincronizacaoAutomaticaSpotify,
  useTocandoAgoraSpotify,
} from '../hooks'
import type { TocandoAgora } from '../types'
import { formatarDataExtensa, formatarDuracaoMs, gerarRotaArtista, gerarRotaMusica } from '../utils'
import { CapaSpotify } from './CapaSpotify'

const pulsoEqualizador = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`

const ATRASOS_BARRAS = ['0s', '0.25s', '0.5s', '0.15s']

export interface CartaoTocandoAgoraProps {
  conectada: boolean
}

export const CartaoTocandoAgora = memo(function CartaoTocandoAgora({
  conectada,
}: CartaoTocandoAgoraProps) {
  const { data } = useTocandoAgoraSpotify(conectada)
  useSincronizacaoAutomaticaSpotify(data)

  if (!conectada || !data) {
    return null
  }

  if (!data.temItem || !data.nome) {
    return <AvisoNadaTocando tocandoAnuncio={data.emReproducao} />
  }

  return <ConteudoTocandoAgora dados={data} />
})

function AvisoNadaTocando({ tocandoAnuncio }: { tocandoAnuncio: boolean }) {
  return (
    <HStack
      gap={2.5}
      px={4}
      py={3}
      borderRadius="8px"
      bg="cirqueira.spotify.cartao"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      color="cirqueira.spotify.textoSecundario"
    >
      <Radio size={15} />
      <Text fontSize="xs">
        {tocandoAnuncio
          ? 'O Spotify está tocando um anúncio ou algo que não é música.'
          : 'Nada tocando no Spotify agora. Quando você der play, a música aparece aqui.'}
      </Text>
    </HStack>
  )
}

function ConteudoTocandoAgora({ dados }: { dados: TocandoAgora }) {
  const agora = useRelogioSpotify()
  const decorrido = dados.emReproducao ? agora - dados.consultadoEm : 0
  const progresso = Math.min(dados.duracaoMs, dados.progressoMs + Math.max(0, decorrido))
  const percentual = dados.duracaoMs > 0 ? (progresso / dados.duracaoMs) * 100 : 0
  const artistaPrincipal = dados.artistas[0] ?? ''
  const ehMusica = dados.tipo === 'track'

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="12px"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      bg="cirqueira.spotify.cartao"
    >
      {dados.capaUrl && (
        <Box
          position="absolute"
          inset="-40px"
          bgImage={`url("${dados.capaUrl}")`}
          bgSize="cover"
          bgPos="center"
          filter="blur(48px) saturate(1.4)"
          opacity={0.35}
          pointerEvents="none"
        />
      )}
      <Box position="absolute" inset={0} bg="cirqueira.spotify.fundo" opacity={0.45} />

      <Flex
        position="relative"
        gap={{ base: 3, sm: 5 }}
        p={{ base: 3.5, sm: 5 }}
        align="center"
        direction={{ base: 'row' }}
      >
        <CapaSpotify
          url={dados.capaUrl}
          alt={dados.album ?? dados.nome ?? ''}
          boxSize={{ base: '84px', sm: '120px' }}
          boxShadow="0 12px 32px rgba(0, 0, 0, 0.5)"
          tamanhoIcone={28}
        />

        <VStack align="stretch" gap={{ base: 1.5, sm: 2 }} flex={1} minW={0}>
          <HStack gap={2}>
            {dados.emReproducao ? (
              <HStack gap="2px" h="12px" align="flex-end">
                {ATRASOS_BARRAS.map((atraso) => (
                  <Box
                    key={atraso}
                    w="3px"
                    h="12px"
                    borderRadius="1px"
                    bg="cirqueira.spotify.verde"
                    transformOrigin="bottom"
                    animation={`${pulsoEqualizador} 0.9s ease-in-out infinite`}
                    animationDelay={atraso}
                  />
                ))}
              </HStack>
            ) : (
              <Box color="cirqueira.spotify.textoSecundario" display="inline-flex">
                <Pause size={12} />
              </Box>
            )}
            <Text
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="wider"
              textTransform="uppercase"
              color={
                dados.emReproducao ? 'cirqueira.spotify.verde' : 'cirqueira.spotify.textoSecundario'
              }
            >
              {dados.emReproducao ? 'Tocando agora' : 'Pausado'}
            </Text>
          </HStack>

          {ehMusica ? (
            <Link
              asChild
              fontSize={{ base: 'md', sm: 'xl' }}
              fontWeight="bold"
              color="cirqueira.spotify.textoPrincipal"
              lineClamp={1}
              _hover={{ textDecoration: 'underline' }}
            >
              <LinkRouter to={gerarRotaMusica(dados.nome ?? '', artistaPrincipal)}>
                {dados.nome}
              </LinkRouter>
            </Link>
          ) : (
            <Text fontSize={{ base: 'md', sm: 'xl' }} fontWeight="bold" lineClamp={1}>
              {dados.nome}
            </Text>
          )}

          <Text
            fontSize={{ base: 'xs', sm: 'sm' }}
            color="cirqueira.spotify.textoSecundario"
            lineClamp={1}
          >
            {ehMusica && artistaPrincipal ? (
              <Link asChild color="inherit" _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}>
                <LinkRouter to={gerarRotaArtista(artistaPrincipal)}>{artistaPrincipal}</LinkRouter>
              </Link>
            ) : (
              artistaPrincipal
            )}
            {dados.artistas.length > 1 ? `, ${dados.artistas.slice(1).join(', ')}` : ''}
            {dados.album ? ` • ${dados.album}` : ''}
          </Text>

          <VStack align="stretch" gap={1} pt={1}>
            <Box h="4px" borderRadius="full" bg="cirqueira.spotify.cartaoElevado" overflow="hidden">
              <Box
                h="full"
                w={`${percentual}%`}
                bg={
                  dados.emReproducao
                    ? 'cirqueira.spotify.verde'
                    : 'cirqueira.spotify.textoSecundario'
                }
                borderRadius="full"
                transition="width 1s linear"
              />
            </Box>
            <HStack justify="space-between">
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                fontVariantNumeric="tabular-nums"
              >
                {formatarDuracaoMs(progresso)}
              </Text>
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                fontVariantNumeric="tabular-nums"
              >
                {formatarDuracaoMs(dados.duracaoMs)}
              </Text>
            </HStack>
          </VStack>

          <Flex gap={2} align="center" wrap="wrap">
            {ehMusica && (
              <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                {dados.vezesOuvida > 0
                  ? `Você já ouviu ${dados.vezesOuvida} ${dados.vezesOuvida === 1 ? 'vez' : 'vezes'} · desde ${formatarDataExtensa(dados.primeiraVezEm)}`
                  : 'Primeira vez no seu histórico'}
              </Text>
            )}
            {dados.urlSpotify && (
              <Button
                asChild
                size="2xs"
                variant="ghost"
                ml="auto"
                color="cirqueira.spotify.textoSecundario"
                _hover={{ color: 'cirqueira.spotify.verde', bg: 'transparent' }}
              >
                <Link href={dados.urlSpotify} target="_blank" rel="noopener noreferrer">
                  Abrir no Spotify <ExternalLink size={12} />
                </Link>
              </Button>
            )}
          </Flex>
        </VStack>
      </Flex>
    </Box>
  )
}
