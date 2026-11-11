import { Box, HStack, Text } from '@chakra-ui/react'
import { ExternalLink } from 'lucide-react'
import { memo } from 'react'
import { IconeFonteMusica } from './IconeFonteMusica'

const LINKS_SERVICOS = [
  { rotulo: 'Abrir no Spotify', url: 'https://open.spotify.com' },
  { rotulo: 'Abrir no YouTube Music', url: 'https://music.youtube.com' },
]

export const RodapeMusica = memo(function RodapeMusica() {
  return (
    <Box
      as="footer"
      pt={8}
      pb={12}
      borderTop="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      w="full"
    >
      <HStack
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={4}
        color="cirqueira.musica.textoSecundario"
        fontSize="xs"
      >
        <HStack gap={3} align="center">
          <HStack gap={1.5}>
            <IconeFonteMusica fonte="spotify" tamanho={22} />
            <IconeFonteMusica fonte="youtube_music" tamanho={22} />
          </HStack>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            Dados do Spotify (Spotify Web API) e do YouTube Music (histórico da sua conta Google).
          </Text>
        </HStack>

        <HStack gap={4} wrap="wrap">
          {LINKS_SERVICOS.map((servico) => (
            <Box
              key={servico.url}
              as="a"
              href={servico.url}
              target="_blank"
              rel="noopener noreferrer"
              color="cirqueira.musica.verde"
              _hover={{ textDecoration: 'underline', color: 'cirqueira.musica.verdeHover' }}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
            >
              <Text as="span" fontWeight="semibold">
                {servico.rotulo}
              </Text>
              <ExternalLink size={14} />
            </Box>
          ))}
        </HStack>
      </HStack>
    </Box>
  )
})
