import { Button, Center, Skeleton, Text, VStack } from '@chakra-ui/react'
import { SearchX } from 'lucide-react'
import { memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'

export const CarregandoDetalheSpotify = memo(function CarregandoDetalheSpotify() {
  return (
    <VStack align="stretch" gap={4}>
      <Skeleton h="300px" borderRadius="16px" />
      <Skeleton h="120px" borderRadius="8px" />
      <Skeleton h="280px" borderRadius="8px" />
    </VStack>
  )
})

export const NaoEncontradoDetalheSpotify = memo(function NaoEncontradoDetalheSpotify({
  mensagem,
}: { mensagem: string }) {
  return (
    <Center py={20}>
      <VStack gap={3} textAlign="center" maxW="sm">
        <SearchX size={40} color="currentColor" />
        <Text fontSize="md" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
          Nada por aqui
        </Text>
        <Text fontSize="sm" color="cirqueira.spotify.textoSecundario">
          {mensagem}
        </Text>
        <Button
          asChild
          size="sm"
          borderRadius="full"
          bg="cirqueira.spotify.verde"
          color="cirqueira.spotify.fundo"
        >
          <LinkRouter to="/spotify">Voltar ao Spotify</LinkRouter>
        </Button>
      </VStack>
    </Center>
  )
})
