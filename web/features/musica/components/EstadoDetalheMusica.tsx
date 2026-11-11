import { Button, Center, Skeleton, Text, VStack } from '@chakra-ui/react'
import { SearchX } from 'lucide-react'
import { memo } from 'react'
import { LinkMusica } from './LinkMusica'

export const CarregandoDetalheMusica = memo(function CarregandoDetalheMusica() {
  return (
    <VStack align="stretch" gap={4}>
      <Skeleton h="300px" borderRadius="16px" />
      <Skeleton h="120px" borderRadius="8px" />
      <Skeleton h="280px" borderRadius="8px" />
    </VStack>
  )
})

export const NaoEncontradoDetalheMusica = memo(function NaoEncontradoDetalheMusica({
  mensagem,
}: { mensagem: string }) {
  return (
    <Center py={20}>
      <VStack gap={3} textAlign="center" maxW="sm">
        <SearchX size={40} color="currentColor" />
        <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
          Nada por aqui
        </Text>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          {mensagem}
        </Text>
        <Button
          asChild
          size="sm"
          borderRadius="full"
          bg="cirqueira.musica.verde"
          color="cirqueira.musica.fundo"
        >
          <LinkMusica to="/musica">Voltar para Música</LinkMusica>
        </Button>
      </VStack>
    </Center>
  )
})
