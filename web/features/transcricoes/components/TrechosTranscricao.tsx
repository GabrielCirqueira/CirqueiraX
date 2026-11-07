import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { SegmentoTranscricao } from '../types'
import { formatarDuracao } from '../utils'
import { TextoDestacado } from './TextoDestacado'

interface TrechoProps {
  indice: number
  segmento: SegmentoTranscricao
  ativo: boolean
  clicavel: boolean
  ultimoAoVivo: boolean
  termo: string
  onClicar: (segmento: SegmentoTranscricao) => void
}

const Trecho = memo(function Trecho({
  indice,
  segmento,
  ativo,
  clicavel,
  ultimoAoVivo,
  termo,
  onClicar,
}: TrechoProps) {
  return (
    <HStack
      data-trecho={indice}
      align="start"
      gap={3}
      px={2.5}
      py={2}
      borderRadius="lg"
      cursor={clicavel ? 'pointer' : 'default'}
      bg={ativo ? 'cirqueira.brand.500/12' : 'transparent'}
      borderLeftWidth="3px"
      borderLeftColor={ativo ? 'cirqueira.brand.500' : 'transparent'}
      transition="background 0.2s ease, border-color 0.2s ease"
      animation={ultimoAoVivo ? 'fade-in 0.5s ease-out' : undefined}
      _hover={clicavel ? { bg: ativo ? 'cirqueira.brand.500/15' : 'bg.subtle' } : undefined}
      onClick={() => clicavel && onClicar(segmento)}
    >
      <Text
        fontSize="11px"
        fontFamily="mono"
        color={ativo ? 'cirqueira.brand.400' : 'fg.subtle'}
        pt="3px"
        minW="44px"
        flexShrink={0}
      >
        {formatarDuracao(segmento.inicio)}
      </Text>
      <Text fontSize="sm" color={ativo ? 'fg' : 'fg.muted'} lineHeight="tall">
        <TextoDestacado texto={segmento.texto} termo={termo} />
      </Text>
    </HStack>
  )
})

export interface TrechosTranscricaoProps {
  segmentos: SegmentoTranscricao[]
  indiceAtivo: number
  clicavel: boolean
  aoVivo: boolean
  termo: string
  onClicarTrecho: (segmento: SegmentoTranscricao) => void
}

export const TrechosTranscricao = memo(function TrechosTranscricao({
  segmentos,
  indiceAtivo,
  clicavel,
  aoVivo,
  termo,
  onClicarTrecho,
}: TrechosTranscricaoProps) {
  return (
    <VStack align="stretch" gap={0.5}>
      {segmentos.map((segmento, indice) => (
        <Trecho
          key={`${segmento.inicio}-${indice}`}
          indice={indice}
          segmento={segmento}
          ativo={indice === indiceAtivo}
          clicavel={clicavel}
          ultimoAoVivo={aoVivo && indice === segmentos.length - 1}
          termo={termo}
          onClicar={onClicarTrecho}
        />
      ))}
      {aoVivo && (
        <HStack gap={2} px={2.5} py={2} color="cirqueira.brand.400">
          {[0, 1, 2].map((ponto) => (
            <Box
              key={ponto}
              boxSize={1.5}
              borderRadius="full"
              bg="currentColor"
              animation={`pulse 1.2s ease-in-out ${ponto * 0.2}s infinite`}
            />
          ))}
          <Text fontSize="xs">ouvindo o próximo trecho…</Text>
        </HStack>
      )}
    </VStack>
  )
})
