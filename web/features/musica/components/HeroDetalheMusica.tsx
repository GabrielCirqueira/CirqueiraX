import { Badge, Box, Button, Flex, HStack, Heading, Link, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { urlCapaExibicao } from '../utils/capaMusica'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'

export interface HeroDetalheMusicaProps {
  tipo: 'artista' | 'faixa'
  rotulo: string
  titulo: string
  subtitulo?: ReactNode
  imagemUrl: string | null
  urlSpotify: string | null
  urlYoutubeMusic?: string | null
  posicaoGeral: number | null
}

export const HeroDetalheMusica = memo(function HeroDetalheMusica({
  tipo,
  rotulo,
  titulo,
  subtitulo,
  imagemUrl,
  urlSpotify,
  urlYoutubeMusic = null,
  posicaoGeral,
}: HeroDetalheMusicaProps) {
  return (
    <Box position="relative" overflow="hidden" borderRadius="16px" bg="cirqueira.musica.cartao">
      {imagemUrl && (
        <Box
          position="absolute"
          inset="-60px"
          bgImage={`url("${urlCapaExibicao(imagemUrl)}")`}
          bgSize="cover"
          bgPos="center"
          filter="blur(60px) saturate(1.5)"
          opacity={0.5}
          pointerEvents="none"
        />
      )}
      <Box
        position="absolute"
        inset={0}
        bgGradient="to-t"
        gradientFrom="cirqueira.musica.fundo"
        gradientTo="transparent"
      />

      <VStack position="relative" align="stretch" gap={4} p={{ base: 4, md: 8 }}>
        <Link
          asChild
          alignSelf="flex-start"
          fontSize="xs"
          color="cirqueira.musica.textoSecundario"
          _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
        >
          <LinkMusica to="/musica">
            <ArrowLeft size={14} /> Voltar para Música
          </LinkMusica>
        </Link>

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 4, md: 8 }}
          align={{ base: 'flex-start', sm: 'flex-end' }}
        >
          <CapaMusica
            url={imagemUrl}
            alt={titulo}
            tipo={tipo}
            boxSize={{ base: '150px', md: '220px' }}
            boxShadow="0 24px 60px rgba(0, 0, 0, 0.55)"
            tamanhoIcone={56}
          />
          <VStack align="flex-start" gap={2} minW={0} flex={1}>
            <HStack gap={2}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="widest"
                color="cirqueira.musica.textoPrincipal"
              >
                {rotulo}
              </Text>
              {posicaoGeral !== null && (
                <Badge
                  size="sm"
                  borderRadius="full"
                  bg="cirqueira.musica.verde"
                  color="cirqueira.musica.fundo"
                  fontWeight="bold"
                >
                  #{posicaoGeral} de todos os tempos
                </Badge>
              )}
            </HStack>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="black"
              lineHeight="1.05"
              letterSpacing="tight"
              color="cirqueira.musica.textoPrincipal"
              wordBreak="break-word"
            >
              {titulo}
            </Heading>
            {subtitulo && (
              <Text fontSize={{ base: 'sm', md: 'md' }} color="cirqueira.musica.textoSecundario">
                {subtitulo}
              </Text>
            )}
            <HStack gap={2} mt={1} wrap="wrap">
              {urlSpotify && (
                <Button
                  asChild
                  size="sm"
                  borderRadius="full"
                  bg="cirqueira.musica.verde"
                  color="cirqueira.musica.fundo"
                  _hover={{ opacity: 0.9 }}
                >
                  <Link
                    href={urlSpotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    _hover={{ textDecoration: 'none' }}
                  >
                    Abrir no Spotify <ExternalLink size={14} />
                  </Link>
                </Button>
              )}
              {urlYoutubeMusic && (
                <Button
                  asChild
                  size="sm"
                  borderRadius="full"
                  variant="outline"
                  borderColor="cirqueira.musica.fonteYoutubeMusic"
                  color="cirqueira.musica.textoPrincipal"
                  _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
                >
                  <Link
                    href={urlYoutubeMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    _hover={{ textDecoration: 'none' }}
                  >
                    Abrir no YouTube Music <ExternalLink size={14} />
                  </Link>
                </Button>
              )}
            </HStack>
          </VStack>
        </Flex>
      </VStack>
    </Box>
  )
})
