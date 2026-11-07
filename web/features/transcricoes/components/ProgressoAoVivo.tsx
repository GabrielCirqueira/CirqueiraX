import { Box, HStack, Progress, Text, VStack } from '@chakra-ui/react'
import { Clock, Radio } from 'lucide-react'
import { memo } from 'react'
import type { TranscricaoDetalhe } from '../types'
import { formatarTempoRestante } from '../utils'

export interface ProgressoAoVivoProps {
  transcricao: TranscricaoDetalhe
}

export const ProgressoAoVivo = memo(function ProgressoAoVivo({
  transcricao,
}: ProgressoAoVivoProps) {
  const naFila = transcricao.status === 'na_fila'
  const restante = formatarTempoRestante(transcricao.segundosRestantesEstimados)

  return (
    <VStack
      align="stretch"
      gap={2.5}
      p={3.5}
      borderRadius="xl"
      bgGradient="to-r"
      gradientFrom="cirqueira.brand.500/15"
      gradientTo="cirqueira.purple.500/10"
      borderWidth="1px"
      borderColor="cirqueira.brand.500/30"
    >
      <HStack justify="space-between" gap={3}>
        <HStack gap={2} color="cirqueira.brand.400">
          {naFila ? (
            <Clock size={16} />
          ) : (
            <Box display="inline-flex" animation="pulse 1.4s ease-in-out infinite">
              <Radio size={16} />
            </Box>
          )}
          <Text fontSize="sm" fontWeight="bold" color="fg">
            {naFila ? 'Na fila, aguardando a vez' : 'Transcrevendo ao vivo'}
          </Text>
        </HStack>
        <Text fontSize="lg" fontWeight="black" color="cirqueira.brand.400" fontFamily="mono">
          {transcricao.progresso}%
        </Text>
      </HStack>
      <Progress.Root
        value={naFila ? null : Math.max(2, transcricao.progresso)}
        size="sm"
        colorPalette="brand"
        striped={!naFila}
        animated={!naFila}
      >
        <Progress.Track borderRadius="full" bg="bg.muted">
          <Progress.Range borderRadius="full" />
        </Progress.Track>
      </Progress.Root>
      <Text fontSize="xs" color="fg.muted">
        {naFila
          ? `Começa quando os áudios à frente terminarem${restante ? ` e depois leva ${restante}` : ''}.`
          : `O texto aparece abaixo conforme cada trecho é reconhecido${restante ? ` · falta ${restante}` : ''}.`}
      </Text>
    </VStack>
  )
})
