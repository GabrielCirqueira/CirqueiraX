import { Badge, Box, Button, Flex, HStack, Heading, Link, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { CapaSpotify } from './CapaSpotify'

export interface HeroDetalheSpotifyProps {
  tipo: 'artista' | 'faixa'
  rotulo: string
  titulo: string
  subtitulo?: ReactNode
  imagemUrl: string | null
  urlSpotify: string | null
  posicaoGeral: number | null
}

export const HeroDetalheSpotify = memo(function HeroDetalheSpotify({
  tipo,
  rotulo,
  titulo,
  subtitulo,
  imagemUrl,
  urlSpotify,
  posicaoGeral,
}: HeroDetalheSpotifyProps) {
  return (
    <Box position="relative" overflow="hidden" borderRadius="16px" bg="cirqueira.spotify.cartao">
      {imagemUrl && (
        <Box
          position="absolute"
          inset="-60px"
          bgImage={`url("${imagemUrl}")`}
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
        gradientFrom="cirqueira.spotify.fundo"
        gradientTo="transparent"
      />

      <VStack position="relative" align="stretch" gap={4} p={{ base: 4, md: 8 }}>
        <Link
          asChild
          alignSelf="flex-start"
          fontSize="xs"
          color="cirqueira.spotify.textoSecundario"
          _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
        >
          <LinkRouter to="/spotify">
            <ArrowLeft size={14} /> Voltar ao Spotify
          </LinkRouter>
        </Link>

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 4, md: 8 }}
          align={{ base: 'flex-start', sm: 'flex-end' }}
        >
          <CapaSpotify
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
                color="cirqueira.spotify.textoPrincipal"
              >
                {rotulo}
              </Text>
              {posicaoGeral !== null && (
                <Badge
                  size="sm"
                  borderRadius="full"
                  bg="cirqueira.spotify.verde"
                  color="cirqueira.spotify.fundo"
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
              color="cirqueira.spotify.textoPrincipal"
              wordBreak="break-word"
            >
              {titulo}
            </Heading>
            {subtitulo && (
              <Text fontSize={{ base: 'sm', md: 'md' }} color="cirqueira.spotify.textoSecundario">
                {subtitulo}
              </Text>
            )}
            {urlSpotify && (
              <Button
                asChild
                size="sm"
                mt={1}
                borderRadius="full"
                bg="cirqueira.spotify.verde"
                color="cirqueira.spotify.fundo"
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
          </VStack>
        </Flex>
      </VStack>
    </Box>
  )
})
