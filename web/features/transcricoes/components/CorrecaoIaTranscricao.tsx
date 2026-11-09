import { Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'
import { memo } from 'react'
import type { TranscricaoDetalhe } from '../types'

export interface CorrecaoIaTranscricaoProps {
  transcricao: TranscricaoDetalhe
  enviando: boolean
  onCorrigir: () => void
}

function formatarData(dataIso: string): string {
  return new Date(dataIso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const CorrecaoIaTranscricao = memo(function CorrecaoIaTranscricao({
  transcricao,
  enviando,
  onCorrigir,
}: CorrecaoIaTranscricaoProps) {
  if (transcricao.isCorrecaoEmAndamento) {
    return (
      <HStack
        gap={3}
        p={3}
        borderRadius="8px"
        bg="cirqueira.purple.500/10"
        borderWidth="1px"
        borderColor="cirqueira.purple.500/30"
      >
        <Spinner size="sm" color="cirqueira.purple.400" />
        <VStack align="start" gap={0}>
          <Text fontSize="sm" fontWeight="semibold">
            {transcricao.statusCorrecao === 'na_fila'
              ? 'Na fila para corrigir…'
              : 'Corrigindo com IA…'}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Textos longos são corrigidos por partes e podem levar alguns minutos.
          </Text>
        </VStack>
      </HStack>
    )
  }

  if (transcricao.statusCorrecao === 'erro') {
    return (
      <Box
        p={3}
        borderRadius="8px"
        bg="cirqueira.red.500/10"
        borderWidth="1px"
        borderColor="cirqueira.red.500/30"
      >
        <HStack justify="space-between" gap={3} flexWrap="wrap">
          <VStack align="start" gap={0.5} flex="1" minW="200px">
            <Text
              fontSize="sm"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              gap={2}
              color="cirqueira.red.500"
            >
              <AlertTriangle size={15} /> A correção com IA falhou
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {transcricao.erroCorrecao}
            </Text>
          </VStack>
          <Button
            size="xs"
            h={8}
            borderRadius="full"
            variant="outline"
            loading={enviando}
            onClick={onCorrigir}
          >
            <RefreshCw size={13} />
            Tentar de novo
          </Button>
        </HStack>
      </Box>
    )
  }

  if (transcricao.statusCorrecao === 'concluida' && transcricao.corrigidoEm) {
    return (
      <HStack justify="space-between" gap={2} flexWrap="wrap">
        <Text fontSize="xs" color="fg.muted" display="flex" alignItems="center" gap={1.5}>
          <Sparkles size={13} color="var(--chakra-colors-cirqueira-purple-400)" />
          Corrigido com IA em {formatarData(transcricao.corrigidoEm)} · o original continua salvo
        </Text>
        <Button
          size="xs"
          h={7}
          borderRadius="full"
          variant="ghost"
          color="fg.muted"
          loading={enviando}
          disabled={!transcricao.isCorrigivel}
          onClick={onCorrigir}
        >
          <RefreshCw size={12} />
          Corrigir de novo
        </Button>
      </HStack>
    )
  }

  return (
    <HStack
      justify="space-between"
      gap={3}
      p={3}
      borderRadius="8px"
      bg="cirqueira.purple.500/8"
      borderWidth="1px"
      borderColor="cirqueira.purple.500/25"
      flexWrap="wrap"
    >
      <VStack align="start" gap={0.5} flex="1" minW="200px">
        <Text fontSize="sm" fontWeight="semibold">
          O texto veio com falhas?
        </Text>
        <Text fontSize="xs" color="fg.muted">
          A IA conserta palavras trocadas, nomes, pontuação e acentos sem mudar o que foi dito. O
          original continua salvo.
        </Text>
      </VStack>
      <Button
        size="sm"
        borderRadius="full"
        colorPalette="purple"
        loading={enviando}
        disabled={!transcricao.isCorrigivel}
        onClick={onCorrigir}
      >
        <Sparkles size={15} />
        Corrigir com IA
      </Button>
    </HStack>
  )
})
