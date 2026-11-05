import { Box, HStack, Image, Text } from '@chakra-ui/react'
import { ExternalLink } from 'lucide-react'
import { memo } from 'react'

export interface RodapeSpotifyProps {
  urlDestino?: string
}

export const RodapeSpotify = memo(function RodapeSpotify({
  urlDestino = 'https://open.spotify.com',
}: RodapeSpotifyProps) {
  return (
    <Box
      as="footer"
      pt={8}
      pb={12}
      borderTop="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      w="full"
    >
      <HStack
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={4}
        color="cirqueira.spotify.textoSecundario"
        fontSize="xs"
      >
        <HStack gap={3} align="center">
          <Box w="24px" h="24px" display="inline-flex" alignItems="center" justifyContent="center">
            <svg
              role="img"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="var(--chakra-colors-cirqueira-spotify-verde)"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Spotify"
            >
              <title>Spotify</title>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.676.467-1.029.25-2.822-1.724-6.375-2.114-10.56-1.157-.403.092-.806-.157-.899-.56-.092-.403.158-.806.56-.899 4.582-1.047 8.52-.604 11.678 1.337.354.217.468.676.25 1.029zm1.468-3.262c-.272.443-.852.584-1.295.312-3.23-1.986-8.156-2.56-11.977-1.4-4.99.151-.937-.24-1.088-.739-.15-.499.24-.937.739-1.088 4.372-1.327 9.8-0.69 13.309 1.62.443.272.584.852.312 1.295zm.126-3.41c-3.873-2.3-10.264-2.512-13.978-1.384-.593.18-1.222-.158-1.402-.751-.18-.593.158-1.222.751-1.402 4.267-1.295 11.323-1.047 15.792 1.606.533.316.708 1.008.392 1.541-.316.533-1.008.708-1.541.392z" />
            </svg>
          </Box>
          <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
            Dados fornecidos e sincronizados via Spotify Web API.
          </Text>
        </HStack>

        <Box
          as="a"
          href={urlDestino}
          target="_blank"
          rel="noopener noreferrer"
          color="cirqueira.spotify.verde"
          _hover={{ textDecoration: 'underline', color: '#22e368' }}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
        >
          <Text as="span" fontWeight="semibold">
            Abrir no Spotify
          </Text>
          <ExternalLink size={14} />
        </Box>
      </HStack>
    </Box>
  )
})
