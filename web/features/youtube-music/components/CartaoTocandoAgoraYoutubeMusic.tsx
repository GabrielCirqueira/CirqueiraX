import { CapaMusica } from '@/features/musica/components/CapaMusica'
import { IconeFonteMusica } from '@/features/musica/components/IconeFonteMusica'
import { LinkMusica } from '@/features/musica/components/LinkMusica'
import {
  formatarDataExtensa,
  formatarDuracaoMs,
  gerarRotaArtista,
  gerarRotaMusica,
  urlCapaExibicao,
} from '@/features/musica/utils'
import { useRelogioSpotify } from '@/features/spotify/hooks'
import { Box, Button, Flex, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { ExternalLink, Pause } from 'lucide-react'
import { memo } from 'react'
import type { TocandoAgoraExtensao } from '../types'
import { calcularProgressoTocandoYoutube, urlVideoYoutubeMusic } from '../utils'

const pulsoEqualizador = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`

const ATRASOS_BARRAS = ['0s', '0.25s', '0.5s', '0.15s']

export interface CartaoTocandoAgoraYoutubeMusicProps {
  tocando: TocandoAgoraExtensao
}

export const CartaoTocandoAgoraYoutubeMusic = memo(function CartaoTocandoAgoraYoutubeMusic({
  tocando,
}: CartaoTocandoAgoraYoutubeMusicProps) {
  const agora = useRelogioSpotify()
  const { progressoMs, duracaoMs, percentual, emReproducao } = calcularProgressoTocandoYoutube(
    tocando,
    agora
  )
  const artistaPrincipal = tocando.artistas[0] ?? ''
  const urlYoutube = urlVideoYoutubeMusic(tocando.videoId)
  const capaFundo = urlCapaExibicao(tocando.urlCapa)
  const corEstado = emReproducao
    ? 'cirqueira.musica.fonteYoutubeMusic'
    : 'cirqueira.musica.textoSecundario'

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="12px"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      bg="cirqueira.musica.cartao"
    >
      {capaFundo && (
        <Box
          position="absolute"
          inset="-40px"
          bgImage={`url("${capaFundo}")`}
          bgSize="cover"
          bgPos="center"
          filter="blur(48px) saturate(1.4)"
          opacity={0.35}
          pointerEvents="none"
        />
      )}
      <Box position="absolute" inset={0} bg="cirqueira.musica.fundo" opacity={0.45} />

      <Flex position="relative" gap={{ base: 3, sm: 5 }} p={{ base: 3.5, sm: 5 }} align="center">
        <CapaMusica
          url={tocando.urlCapa}
          alt={tocando.album ?? tocando.titulo}
          boxSize={{ base: '84px', sm: '120px' }}
          boxShadow="0 12px 32px rgba(0, 0, 0, 0.5)"
          tamanhoIcone={28}
        />

        <VStack align="stretch" gap={{ base: 1.5, sm: 2 }} flex={1} minW={0}>
          <HStack gap={2}>
            {emReproducao ? (
              <HStack gap="2px" h="12px" align="flex-end">
                {ATRASOS_BARRAS.map((atraso) => (
                  <Box
                    key={atraso}
                    w="3px"
                    h="12px"
                    borderRadius="1px"
                    bg="cirqueira.musica.fonteYoutubeMusic"
                    transformOrigin="bottom"
                    animation={`${pulsoEqualizador} 0.9s ease-in-out infinite`}
                    animationDelay={atraso}
                  />
                ))}
              </HStack>
            ) : (
              <Box color="cirqueira.musica.textoSecundario" display="inline-flex">
                <Pause size={12} />
              </Box>
            )}
            <Text
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="wider"
              textTransform="uppercase"
              color={corEstado}
            >
              {emReproducao ? 'Tocando agora' : 'Pausado'}
            </Text>
            <IconeFonteMusica fonte="youtube_music" tamanho={14} />
          </HStack>

          {tocando.identificada ? (
            <Link
              asChild
              fontSize={{ base: 'md', sm: 'xl' }}
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              lineClamp={1}
              _hover={{ textDecoration: 'underline' }}
            >
              <LinkMusica to={gerarRotaMusica(tocando.titulo, artistaPrincipal)}>
                {tocando.titulo}
              </LinkMusica>
            </Link>
          ) : (
            <Text
              fontSize={{ base: 'md', sm: 'xl' }}
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              lineClamp={1}
            >
              {tocando.titulo}
            </Text>
          )}

          <Text
            fontSize={{ base: 'xs', sm: 'sm' }}
            color="cirqueira.musica.textoSecundario"
            lineClamp={1}
          >
            {tocando.identificada && artistaPrincipal ? (
              <Link asChild color="inherit" _hover={{ color: 'cirqueira.musica.textoPrincipal' }}>
                <LinkMusica to={gerarRotaArtista(artistaPrincipal)}>{artistaPrincipal}</LinkMusica>
              </Link>
            ) : (
              artistaPrincipal
            )}
            {tocando.artistas.length > 1 ? `, ${tocando.artistas.slice(1).join(', ')}` : ''}
            {tocando.album ? ` • ${tocando.album}` : ''}
          </Text>

          <VStack align="stretch" gap={1} pt={1}>
            <Box h="4px" borderRadius="full" bg="cirqueira.musica.cartaoElevado" overflow="hidden">
              <Box
                h="full"
                w={`${percentual}%`}
                bg={corEstado}
                borderRadius="full"
                transition="width 1s linear"
              />
            </Box>
            <HStack justify="space-between">
              <Text
                fontSize="2xs"
                color="cirqueira.musica.textoSecundario"
                fontVariantNumeric="tabular-nums"
              >
                {formatarDuracaoMs(progressoMs)}
              </Text>
              {duracaoMs && (
                <Text
                  fontSize="2xs"
                  color="cirqueira.musica.textoSecundario"
                  fontVariantNumeric="tabular-nums"
                >
                  {formatarDuracaoMs(duracaoMs)}
                </Text>
              )}
            </HStack>
          </VStack>

          <Flex gap={2} align="center" wrap="wrap">
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
              {!tocando.identificada
                ? 'Identificando a música…'
                : tocando.vezesOuvida > 0
                  ? `Você já ouviu ${tocando.vezesOuvida} ${tocando.vezesOuvida === 1 ? 'vez' : 'vezes'} · desde ${formatarDataExtensa(tocando.primeiraVezEm)}`
                  : 'Primeira vez no seu histórico'}
            </Text>
            {urlYoutube && (
              <Button
                asChild
                size="2xs"
                variant="ghost"
                ml="auto"
                color="cirqueira.musica.textoSecundario"
                _hover={{ color: 'cirqueira.musica.fonteYoutubeMusic', bg: 'transparent' }}
              >
                <Link href={urlYoutube} target="_blank" rel="noopener noreferrer">
                  Abrir no YouTube Music <ExternalLink size={12} />
                </Link>
              </Button>
            )}
          </Flex>
        </VStack>
      </Flex>
    </Box>
  )
})
