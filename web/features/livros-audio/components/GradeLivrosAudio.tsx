import { Box, Button, Center, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { BookOpen, Plus } from 'lucide-react'
import { memo } from 'react'
import { useLivrosComOffline } from '../hooks/useOfflineLivro'
import type { FilaGeracao, LivroAudio } from '../types'
import { contarPartesNaFrente } from '../utils/livros'
import { CardLivroAudio } from './CardLivroAudio'

interface GradeLivrosAudioProps {
  livros: LivroAudio[] | undefined
  carregando: boolean
  apagandoUuid: string | null
  fila?: FilaGeracao
  onNovoLivro: () => void
  onApagarLivro: (uuid: string) => void
}

export const GradeLivrosAudio = memo(function GradeLivrosAudio({
  livros,
  carregando,
  apagandoUuid,
  fila,
  onNovoLivro,
  onApagarLivro,
}: GradeLivrosAudioProps) {
  const { data: partesOffline } = useLivrosComOffline()

  if (carregando) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={5} w="full">
        {Array.from({ length: 6 }).map((_, index) => (
          <Box
            key={`skeleton-${index + 1}`}
            bg="cirqueira.grey.950"
            border="1px solid"
            borderColor="cirqueira.grey.900"
            borderRadius="8px"
            p={5}
            h="210px"
          >
            <VStack align="stretch" gap={4}>
              <Skeleton height="36px" borderRadius="8px" bg="cirqueira.grey.900" />
              <Skeleton height="16px" borderRadius="8px" bg="cirqueira.grey.900" />
              <Skeleton height="8px" borderRadius="full" bg="cirqueira.grey.900" />
              <Skeleton height="28px" borderRadius="8px" bg="cirqueira.grey.900" mt={2} />
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    )
  }

  if (!livros || livros.length === 0) {
    return (
      <Center
        w="full"
        minH="360px"
        bg="cirqueira.grey.950"
        border="1px dashed"
        borderColor="cirqueira.grey.800"
        borderRadius="8px"
        p={8}
      >
        <VStack gap={4} maxW="md" textAlign="center">
          <Center
            boxSize={16}
            borderRadius="8px"
            bg="cirqueira.brand.500/10"
            color="cirqueira.brand.400"
            border="1px solid"
            borderColor="cirqueira.brand.500/20"
          >
            <BookOpen size={32} />
          </Center>

          <VStack gap={1.5}>
            <Text fontSize="lg" fontWeight="bold" color="cirqueira.grey.0">
              Sua biblioteca está vazia
            </Text>
            <Text fontSize="sm" color="cirqueira.grey.400">
              Envie seu primeiro livro em PDF para começar a ler com áudio sincronizado e marcador
              automático de páginas.
            </Text>
          </VStack>

          <Button
            size="sm"
            borderRadius="full"
            bg="cirqueira.brand.500"
            _hover={{ bg: 'cirqueira.brand.600' }}
            color="cirqueira.grey.0"
            px={5}
            onClick={onNovoLivro}
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Adicionar Livro
          </Button>
        </VStack>
      </Center>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={5} w="full">
      {livros.map((livro) => (
        <CardLivroAudio
          key={livro.uuid}
          livro={livro}
          partesNaFrente={contarPartesNaFrente(livro, livros)}
          itemFila={fila?.livros.find((item) => item.uuid === livro.uuid)}
          apagando={apagandoUuid === livro.uuid}
          partesOffline={partesOffline?.get(livro.uuid) ?? 0}
          onApagar={onApagarLivro}
        />
      ))}
    </SimpleGrid>
  )
})
