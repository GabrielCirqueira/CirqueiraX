import { Button, HStack, NativeSelect, Progress, Text, VStack } from '@chakra-ui/react'
import { Clock, RotateCcw, Trash2 } from 'lucide-react'
import { type ChangeEvent, memo, useState } from 'react'
import type { IdiomaTranscricao, TranscricaoDetalhe } from '../types'
import {
  OPCOES_IDIOMA,
  calcularPercentualValidadeAudio,
  descreverValidadeAudio,
  isIdiomaTranscricao,
  isValidadeCritica,
} from '../utils'

export interface RodapeAcoesTranscricaoProps {
  transcricao: TranscricaoDetalhe
  agora: number
  reprocessando: boolean
  apagando: boolean
  onReprocessar: (idioma: IdiomaTranscricao) => void
  onApagar: () => void
}

export const RodapeAcoesTranscricao = memo(function RodapeAcoesTranscricao({
  transcricao,
  agora,
  reprocessando,
  apagando,
  onReprocessar,
  onApagar,
}: RodapeAcoesTranscricaoProps) {
  const [idioma, setIdioma] = useState<IdiomaTranscricao>(transcricao.idiomaSolicitado)
  const [confirmando, setConfirmando] = useState(false)
  const percentualValidade = calcularPercentualValidadeAudio(transcricao, agora)

  function aoMudarIdioma(evento: ChangeEvent<HTMLSelectElement>) {
    if (isIdiomaTranscricao(evento.target.value)) setIdioma(evento.target.value)
  }

  function apagarComConfirmacao() {
    if (confirmando) {
      onApagar()
      return
    }
    setConfirmando(true)
  }

  return (
    <VStack align="stretch" gap={3} pt={3} borderTopWidth="1px" borderColor="border.subtle">
      <VStack align="stretch" gap={1}>
        {percentualValidade !== null && (
          <Progress.Root
            value={percentualValidade}
            size="xs"
            colorPalette={isValidadeCritica(percentualValidade) ? 'amber' : 'brand'}
          >
            <Progress.Track borderRadius="full" bg="bg.muted">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
        )}
        <HStack gap={1} color="fg.subtle">
          <Clock size={11} />
          <Text fontSize="11px">{descreverValidadeAudio(transcricao, agora)}</Text>
        </HStack>
      </VStack>

      <HStack gap={2} flexWrap="wrap" justify="space-between">
        {transcricao.isReprocessavel ? (
          <HStack gap={1.5}>
            <NativeSelect.Root size="xs" w="150px">
              <NativeSelect.Field value={idioma} onChange={aoMudarIdioma} borderRadius="8px" h={8}>
                {OPCOES_IDIOMA.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.bandeira} {opcao.rotulo}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Button
              size="xs"
              h={8}
              variant="outline"
              borderRadius="full"
              loading={reprocessando}
              onClick={() => onReprocessar(idioma)}
            >
              <RotateCcw size={13} />
              Transcrever de novo
            </Button>
          </HStack>
        ) : (
          <Text fontSize="11px" color="fg.subtle">
            {transcricao.isEmAndamento ? 'Ações liberadas quando terminar' : ''}
          </Text>
        )}

        <Button
          size="xs"
          h={8}
          variant={confirmando ? 'solid' : 'ghost'}
          colorPalette="red"
          borderRadius="full"
          loading={apagando}
          disabled={!transcricao.isApagavel}
          title={
            transcricao.isApagavel ? 'Apagar transcrição e áudio' : 'Espere a transcrição terminar'
          }
          onClick={apagarComConfirmacao}
          onMouseLeave={() => setConfirmando(false)}
        >
          <Trash2 size={13} />
          {confirmando ? 'Confirmar exclusão' : 'Apagar'}
        </Button>
      </HStack>
    </VStack>
  )
})
