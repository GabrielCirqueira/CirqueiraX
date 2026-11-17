import { Box, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { BookOpen, Play } from 'lucide-react'
import { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useEstatisticasEscuta } from '../hooks/useDashboard'

export const ContinuarOuvindoOperador = memo(function ContinuarOuvindoOperador() {
  const { data, isLoading } = useEstatisticasEscuta()

  if (isLoading) {
    return <Skeleton h="120px" borderRadius="xl" />
  }

  const livros = data?.continuar ?? []
  const minutosHoje = Math.round((data?.hojeSegundos ?? 0) / 60)

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={{ base: 4, md: 5 }}
    >
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={0}>
            <Text fontWeight="bold" color="fg">
              Livros em áudio
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {minutosHoje > 0 ? `${minutosHoje} min ouvidos hoje` : 'Nada ouvido hoje ainda'}
            </Text>
          </VStack>
          <Box
            as={RouterLink}
            to="/livros-audio"
            fontSize="sm"
            color="cirqueira.brand.400"
            fontWeight="semibold"
          >
            Ver todos
          </Box>
        </HStack>

        {livros.length === 0 ? (
          <HStack
            gap={3}
            p={3}
            borderRadius="lg"
            bg="bg.muted"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <BookOpen size={18} color="var(--chakra-colors-fg-muted)" />
            <Text fontSize="sm" color="fg.muted">
              Nenhum livro em andamento. Abra a biblioteca para começar.
            </Text>
          </HStack>
        ) : (
          <VStack align="stretch" gap={2}>
            {livros.slice(0, 3).map((livro) => (
              <HStack
                key={livro.uuid}
                as={RouterLink}
                to={`/livros-audio/${livro.uuid}`}
                gap={3}
                p={3}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.muted"
                _hover={{ borderColor: 'border.emphasized' }}
              >
                <Box
                  boxSize={8}
                  borderRadius="md"
                  bg="cirqueira.emerald.500/15"
                  color="cirqueira.emerald.400"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Play size={14} />
                </Box>
                <VStack align="start" gap={0} minW={0} flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg" truncate>
                    {livro.titulo}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    Continuar ouvindo
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
})
