import { Badge, Box, HStack, Progress, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, Clock, FileAudio, Loader2, Star } from 'lucide-react'
import { memo } from 'react'
import type { TranscricaoResumo } from '../types'
import {
  formatarDuracao,
  formatarTempoRestante,
  nomeIdioma,
  obterAparenciaStatus,
  resumirErro,
  tokenCorStatus,
} from '../utils'

function IconeStatus({ transcricao }: { transcricao: TranscricaoResumo }) {
  if (transcricao.status === 'transcrevendo') {
    return <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
  }
  if (transcricao.status === 'na_fila') return <Clock size={16} />
  if (transcricao.status === 'erro') return <AlertTriangle size={16} />
  return <FileAudio size={16} />
}

export interface CardTranscricaoProps {
  transcricao: TranscricaoResumo
  selecionada: boolean
  onSelecionar: (uuid: string) => void
}

export const CardTranscricao = memo(function CardTranscricao({
  transcricao,
  selecionada,
  onSelecionar,
}: CardTranscricaoProps) {
  const aparencia = obterAparenciaStatus(transcricao.status)
  const duracao = formatarDuracao(transcricao.duracaoSegundos)
  const idioma = nomeIdioma(transcricao)
  const restante = formatarTempoRestante(transcricao.segundosRestantesEstimados)
  const erro = resumirErro(transcricao.erroMotivo)

  return (
    <VStack
      as="button"
      align="stretch"
      gap={2}
      p={3}
      w="full"
      textAlign="left"
      bg={selecionada ? 'cirqueira.brand.500/10' : 'bg.panel'}
      borderWidth="1px"
      borderColor={selecionada ? 'cirqueira.brand.500' : 'border.subtle'}
      borderRadius="8px"
      cursor="pointer"
      transition="all 0.18s ease"
      animation="fade-in 0.3s ease-out"
      _hover={{
        bg: selecionada ? 'cirqueira.brand.500/10' : 'bg.muted',
        borderColor: selecionada ? 'cirqueira.brand.500' : 'border.emphasized',
        shadow: 'sm',
      }}
      onClick={() => onSelecionar(transcricao.uuid)}
    >
      <HStack gap={2.5} align="start">
        <Box
          p={2}
          borderRadius="8px"
          flexShrink={0}
          bg={`${tokenCorStatus(aparencia.paleta, 500)}/12`}
          color={tokenCorStatus(aparencia.paleta, 400)}
          display="inline-flex"
        >
          <IconeStatus transcricao={transcricao} />
        </Box>
        <VStack align="stretch" gap={0.5} flex={1} minW={0}>
          <HStack gap={1.5} justify="space-between">
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg"
              truncate
              title={transcricao.titulo}
            >
              {transcricao.titulo}
            </Text>
            {transcricao.favorita && (
              <Box color="cirqueira.amber.400" flexShrink={0} display="inline-flex">
                <Star size={13} fill="currentColor" />
              </Box>
            )}
          </HStack>
          <HStack gap={1.5} flexWrap="wrap">
            <Badge size="xs" variant="subtle" colorPalette={aparencia.paleta} borderRadius="full">
              {transcricao.status === 'transcrevendo'
                ? `${transcricao.progresso}%`
                : aparencia.rotulo}
            </Badge>
            {duracao && (
              <Text fontSize="11px" color="fg.subtle" fontFamily="mono">
                {duracao}
              </Text>
            )}
            {idioma && (
              <Text fontSize="11px" color="fg.subtle">
                · {idioma}
              </Text>
            )}
            {transcricao.status === 'concluida' && (
              <Text fontSize="11px" color="fg.subtle">
                · {transcricao.totalPalavras} palavras
              </Text>
            )}
          </HStack>
        </VStack>
      </HStack>

      {transcricao.isEmAndamento && (
        <VStack align="stretch" gap={1}>
          <Progress.Root
            value={transcricao.status === 'na_fila' ? null : Math.max(2, transcricao.progresso)}
            size="xs"
            colorPalette="brand"
          >
            <Progress.Track borderRadius="full" bg="bg.muted">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          {restante && (
            <Text fontSize="10px" color="fg.subtle">
              {transcricao.status === 'na_fila'
                ? `Aguardando a vez · leva ${restante}`
                : `Falta ${restante}`}
            </Text>
          )}
        </VStack>
      )}

      {transcricao.previaTexto && (
        <Text fontSize="xs" color="fg.muted" lineClamp={2} lineHeight="tall">
          {transcricao.previaTexto}
        </Text>
      )}

      {erro && (
        <Text fontSize="11px" color="cirqueira.red.500" lineClamp={2}>
          {erro}
        </Text>
      )}
    </VStack>
  )
})
