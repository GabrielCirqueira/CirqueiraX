import { Box, Button, Center, Heading, Text, VStack } from '@chakra-ui/react'
import { Music2, Upload } from 'lucide-react'
import { memo } from 'react'
import { useObterUrlAutorizacaoSpotify } from '../hooks'

export interface EstadoVazioSpotifyProps {
  conectada: boolean
  onAbrirModalImportacao: () => void
}

export const EstadoVazioSpotify = memo(function EstadoVazioSpotify({
  conectada,
  onAbrirModalImportacao,
}: EstadoVazioSpotifyProps) {
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
      bg="cirqueira.spotify.cartao"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      textAlign="center"
    >
      <Center
        boxSize={16}
        borderRadius="full"
        bg="cirqueira.spotify.cartaoElevado"
        color="cirqueira.spotify.verde"
        mx="auto"
        mb={4}
      >
        <Music2 size={32} />
      </Center>

      <Heading
        as="h2"
        fontSize="lg"
        fontWeight="bold"
        color="cirqueira.spotify.textoPrincipal"
        mb={2}
      >
        {conectada
          ? 'Nenhum histórico registrado ainda'
          : 'Sua Cápsula Sonora está pronta para reviver suas músicas'}
      </Heading>

      <Text
        fontSize="sm"
        color="cirqueira.spotify.textoSecundario"
        maxW="md"
        mx="auto"
        mb={6}
        lineHeight="tall"
      >
        {conectada
          ? 'Importe o arquivo do histórico completo exportado do Spotify ou comece a ouvir para acumular novos dados pela sincronização automática.'
          : 'Conecte sua conta do Spotify para ativar a coleta automática a cada 5 minutos ou importe seu arquivo histórico para acessar os meses anteriores.'}
      </Text>

      <Center gap={3} flexWrap="wrap">
        {!conectada && (
          <Button
            bg="cirqueira.spotify.verde"
            color="cirqueira.grey.950"
            borderRadius="full"
            fontWeight="bold"
            fontSize="sm"
            _hover={{ bg: 'cirqueira.spotify.verdeHover', transform: 'scale(1.02)' }}
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

        <Button
          variant="outline"
          borderRadius="full"
          borderColor="cirqueira.spotify.cartaoElevado"
          color="cirqueira.spotify.textoPrincipal"
          _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
          onClick={onAbrirModalImportacao}
          h="40px"
          px={6}
          fontSize="sm"
        >
          <Upload size={14} style={{ marginRight: '6px' }} />
          Importar arquivo de histórico
        </Button>
      </Center>
    </Box>
  )
})
