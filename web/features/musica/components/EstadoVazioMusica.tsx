import { useObterUrlAutorizacaoSpotify } from '@/features/spotify/hooks/useAutorizacaoSpotify'
import { Box, Button, Center, Heading, Text, VStack } from '@chakra-ui/react'
import { Music2, Upload } from 'lucide-react'
import { memo } from 'react'
import type { FonteMusica } from '../types'
import { textosEstadoVazioMusica } from '../utils'

export interface EstadoVazioMusicaProps {
  conectada: boolean
  fonte: FonteMusica
  onAbrirModalImportacao: () => void
  onConectarYoutubeMusic?: () => void
}

export const EstadoVazioMusica = memo(function EstadoVazioMusica({
  conectada,
  fonte,
  onAbrirModalImportacao,
  onConectarYoutubeMusic,
}: EstadoVazioMusicaProps) {
  const textos = textosEstadoVazioMusica(conectada, fonte)
  const obterUrlMutation = useObterUrlAutorizacaoSpotify()

  function handleVincular() {
    obterUrlMutation.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  return (
    <Box
      p={{ base: 8, md: 12 }}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      textAlign="center"
    >
      <Center
        boxSize={16}
        borderRadius="full"
        bg="cirqueira.musica.cartaoElevado"
        color="cirqueira.musica.verde"
        mx="auto"
        mb={4}
      >
        <Music2 size={32} />
      </Center>

      <Heading
        as="h2"
        fontSize="lg"
        fontWeight="bold"
        color="cirqueira.musica.textoPrincipal"
        mb={2}
      >
        {textos.titulo}
      </Heading>

      <Text
        fontSize="sm"
        color="cirqueira.musica.textoSecundario"
        maxW="md"
        mx="auto"
        mb={6}
        lineHeight="tall"
      >
        {textos.descricao}
      </Text>

      <Center gap={3} flexWrap="wrap">
        {textos.mostrarSpotify && (
          <Button
            bg="cirqueira.musica.verde"
            color="cirqueira.grey.950"
            borderRadius="full"
            fontWeight="bold"
            fontSize="sm"
            _hover={{ bg: 'cirqueira.musica.verdeHover', transform: 'scale(1.02)' }}
            _active={{ transform: 'scale(0.98)' }}
            transition="all 0.15s ease"
            onClick={handleVincular}
            loading={obterUrlMutation.isPending}
            h="40px"
            px={6}
          >
            Vincular ao Spotify
          </Button>
        )}

        {textos.mostrarImportacaoSpotify && (
          <Button
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
            onClick={onAbrirModalImportacao}
            h="40px"
            px={6}
            fontSize="sm"
          >
            <Upload size={14} style={{ marginRight: '6px' }} />
            Importar arquivo de histórico
          </Button>
        )}

        {textos.mostrarYoutubeMusic && onConectarYoutubeMusic && (
          <Button
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.fonteYoutubeMusic"
            color="cirqueira.musica.textoPrincipal"
            _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
            onClick={onConectarYoutubeMusic}
            h="40px"
            px={6}
            fontSize="sm"
          >
            Conectar o YouTube Music
          </Button>
        )}
      </Center>
    </Box>
  )
})
