import { Box, HStack, Progress, Text } from '@chakra-ui/react'
import { Headphones } from 'lucide-react'
import { memo } from 'react'
import { useLivrosAudio } from '../hooks/useLivrosAudio'
import type { LivroAudio } from '../types'
import { contarPartesNaFrente, obterProgressoAudio } from '../utils/livros'

interface AvisoProgressoAudioProps {
  livro: LivroAudio
}

export const AvisoProgressoAudio = memo(function AvisoProgressoAudio({
  livro,
}: AvisoProgressoAudioProps) {
  const { data: livros } = useLivrosAudio()

  if (livro.isPronto) return null

  const progresso = obterProgressoAudio(livro, contarPartesNaFrente(livro, livros))

  return (
    <Box
      bg="cirqueira.grey.950"
      borderTop="1px solid"
      borderColor="cirqueira.grey.900"
      px={4}
      py={2}
    >
      <HStack gap={2} align="center" mb={1.5}>
        <Headphones size={14} color="var(--chakra-colors-cirqueira-brand-400)" />
        <Text fontSize="xs" fontWeight="bold" color="cirqueira.grey.100">
          {progresso.titulo}
        </Text>
        <Text fontSize="xs" color="cirqueira.grey.400" lineClamp={1}>
          {progresso.detalhe}
        </Text>
      </HStack>
      <Progress.Root value={progresso.percentual} size="xs" colorPalette="brand">
        <Progress.Track bg="cirqueira.grey.900" borderRadius="full">
          <Progress.Range borderRadius="full" />
        </Progress.Track>
      </Progress.Root>
    </Box>
  )
})
