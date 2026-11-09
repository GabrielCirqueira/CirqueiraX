import { addToast } from '@/shared/components/ui/toaster'
import { Box, Center, Skeleton, Spinner, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, FileX2 } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  useApagarTranscricao,
  useAtualizarTranscricao,
  useCopiarTexto,
  useCorrigirTranscricaoComIa,
  useDetalheTranscricao,
  useReprocessarTranscricao,
} from '../hooks'
import type {
  FormatoExportacao,
  IdiomaTranscricao,
  ModoVisualizacaoTexto,
  SegmentoTranscricao,
} from '../types'
import {
  baixarExportacao,
  contarOcorrencias,
  encontrarIndiceSegmentoAtual,
  rolarAteTrechoNoContainer,
} from '../utils'
import { BarraFerramentasTexto } from './BarraFerramentasTexto'
import { CabecalhoPainelTranscricao } from './CabecalhoPainelTranscricao'
import { CorrecaoIaTranscricao } from './CorrecaoIaTranscricao'
import { PlayerTranscricao } from './PlayerTranscricao'
import { ProgressoAoVivo } from './ProgressoAoVivo'
import { RodapeAcoesTranscricao } from './RodapeAcoesTranscricao'
import { TextoCorridoTranscricao } from './TextoCorridoTranscricao'
import { TrechosTranscricao } from './TrechosTranscricao'

export interface PainelTranscricaoProps {
  uuid: string
  onFechar: () => void
}

export const PainelTranscricao = memo(function PainelTranscricao({
  uuid,
  onFechar,
}: PainelTranscricaoProps) {
  const { data: transcricao, isLoading, isError } = useDetalheTranscricao(uuid)
  const atualizar = useAtualizarTranscricao()
  const reprocessar = useReprocessarTranscricao()
  const apagar = useApagarTranscricao()
  const copiar = useCopiarTexto()
  const corrigir = useCorrigirTranscricaoComIa()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const areaTextoRef = useRef<HTMLDivElement | null>(null)
  const [tempoAtual, setTempoAtual] = useState(0)
  const [modo, setModo] = useState<ModoVisualizacaoTexto>('trechos')
  const [termo, setTermo] = useState('')
  const [seguirAudio, setSeguirAudio] = useState(true)

  const segmentos = transcricao?.segmentos ?? []
  const indiceAtivo = transcricao?.isAudioDisponivel
    ? encontrarIndiceSegmentoAtual(segmentos, tempoAtual)
    : -1
  const textoCorrigido = transcricao?.textoCorrigido ?? null
  const ocorrencias = useMemo(
    () =>
      modo === 'corrigido' && textoCorrigido
        ? contarOcorrencias([{ inicio: 0, fim: 0, texto: textoCorrigido }], termo)
        : contarOcorrencias(segmentos, termo),
    [modo, textoCorrigido, segmentos, termo]
  )
  const statusCorrecao = transcricao?.statusCorrecao ?? null
  const statusCorrecaoAnterior = useRef(statusCorrecao)

  useEffect(() => {
    const anterior = statusCorrecaoAnterior.current
    statusCorrecaoAnterior.current = statusCorrecao
    if (anterior !== 'na_fila' && anterior !== 'corrigindo') return
    if (statusCorrecao === 'concluida') {
      setModo('corrigido')
      addToast({ title: 'Texto corrigido com IA', type: 'success' })
      return
    }
    if (statusCorrecao === 'erro') {
      addToast({ title: 'A correção com IA falhou', type: 'error' })
    }
  }, [statusCorrecao])

  function aoAtualizarTempo(segundos: number) {
    const indiceNovo = encontrarIndiceSegmentoAtual(segmentos, segundos)
    if (seguirAudio && modo === 'trechos' && indiceNovo !== indiceAtivo && indiceNovo >= 0) {
      rolarAteTrechoNoContainer(areaTextoRef.current, indiceNovo)
    }
    setTempoAtual(segundos)
  }

  function tocarTrecho(segmento: SegmentoTranscricao) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = segmento.inicio
    setTempoAtual(segmento.inicio)
    void audio.play()
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3} p={5}>
        <Skeleton h="28px" w="60%" borderRadius="8px" />
        <Skeleton h="16px" w="40%" borderRadius="8px" />
        <Skeleton h="56px" borderRadius="8px" />
        <Skeleton h="240px" borderRadius="8px" />
      </VStack>
    )
  }

  if (isError || !transcricao) {
    return (
      <Center py={16} px={6}>
        <VStack gap={2} color="fg.subtle" textAlign="center">
          <FileX2 size={28} />
          <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
            Transcrição não encontrada
          </Text>
          <Text fontSize="xs">Ela pode ter sido apagada.</Text>
        </VStack>
      </Center>
    )
  }

  const aoVivo = transcricao.isEmAndamento
  const temTexto = segmentos.length > 0
  const temCorrigido = Boolean(transcricao.textoCorrigido)
  const modoExibido = modo === 'corrigido' && !temCorrigido ? 'corrido' : modo

  function exportar(formato: FormatoExportacao) {
    if (transcricao) baixarExportacao(transcricao, formato, modoExibido === 'corrigido')
  }

  function reprocessarCom(idioma: IdiomaTranscricao) {
    reprocessar.mutate({ uuid, idioma })
  }

  function apagarTranscricao() {
    apagar.mutate(uuid, { onSuccess: onFechar })
  }

  return (
    <VStack align="stretch" gap={4} p={{ base: 4, md: 5 }}>
      <CabecalhoPainelTranscricao
        transcricao={transcricao}
        salvando={atualizar.isPending}
        onRenomear={(titulo) => atualizar.mutate({ uuid, payload: { titulo } })}
        onAlternarFavorita={() =>
          atualizar.mutate({ uuid, payload: { favorita: !transcricao.favorita } })
        }
        onFechar={onFechar}
      />

      {aoVivo && <ProgressoAoVivo transcricao={transcricao} />}

      {transcricao.status === 'erro' && (
        <Box
          p={3}
          borderRadius="8px"
          bg="cirqueira.red.500/10"
          borderWidth="1px"
          borderColor="cirqueira.red.500/30"
          color="cirqueira.red.500"
        >
          <VStack align="stretch" gap={1}>
            <Text fontSize="sm" fontWeight="bold" display="flex" alignItems="center" gap={2}>
              <AlertTriangle size={15} /> Não foi possível transcrever
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {transcricao.erroMotivo}
            </Text>
          </VStack>
        </Box>
      )}

      {transcricao.isAudioDisponivel && (
        <PlayerTranscricao
          uuid={uuid}
          audioRef={audioRef}
          tempoAtual={tempoAtual}
          duracaoConhecida={transcricao.duracaoSegundos}
          onTempoAtualizado={aoAtualizarTempo}
        />
      )}

      {temTexto && !aoVivo && transcricao.status === 'concluida' && (
        <CorrecaoIaTranscricao
          transcricao={transcricao}
          enviando={corrigir.isPending}
          onCorrigir={() => corrigir.mutate(uuid)}
        />
      )}

      {temTexto && !aoVivo && (
        <BarraFerramentasTexto
          modo={modoExibido}
          termo={termo}
          ocorrencias={ocorrencias}
          seguirAudio={seguirAudio}
          exibirSeguirAudio={transcricao.isAudioDisponivel && modoExibido === 'trechos'}
          exibirCorrigido={temCorrigido}
          onMudarModo={setModo}
          onMudarTermo={setTermo}
          onAlternarSeguirAudio={() => setSeguirAudio((atual) => !atual)}
          onCopiar={() =>
            modoExibido === 'corrigido'
              ? copiar(transcricao.textoCorrigido ?? '', 'Texto corrigido copiado.')
              : copiar(transcricao.texto ?? '', `${transcricao.totalPalavras} palavras copiadas.`)
          }
          onExportar={exportar}
        />
      )}

      <Box
        ref={areaTextoRef}
        maxH={{ base: '55vh', lg: 'calc(100vh - 420px)' }}
        minH={temTexto ? '200px' : undefined}
        overflowY="auto"
        display="flex"
        flexDirection={aoVivo ? 'column-reverse' : 'column'}
        pr={1}
      >
        <Box>
          {temTexto && modoExibido === 'trechos' && (
            <TrechosTranscricao
              segmentos={segmentos}
              indiceAtivo={indiceAtivo}
              clicavel={transcricao.isAudioDisponivel}
              aoVivo={aoVivo}
              termo={termo}
              onClicarTrecho={tocarTrecho}
            />
          )}
          {temTexto && modoExibido === 'corrido' && (
            <TextoCorridoTranscricao texto={transcricao.texto ?? ''} termo={termo} />
          )}
          {temTexto && modoExibido === 'corrigido' && (
            <TextoCorridoTranscricao texto={transcricao.textoCorrigido ?? ''} termo={termo} />
          )}
          {!temTexto && aoVivo && (
            <Center py={10} gap={3} color="fg.subtle">
              <Spinner size="sm" color="cirqueira.brand.400" />
              <Text fontSize="sm">
                {transcricao.status === 'na_fila'
                  ? 'Esperando a vez na fila…'
                  : 'Preparando o áudio…'}
              </Text>
            </Center>
          )}
        </Box>
      </Box>

      <RodapeAcoesTranscricao
        key={transcricao.idiomaSolicitado}
        transcricao={transcricao}
        agora={Date.now()}
        reprocessando={reprocessar.isPending}
        apagando={apagar.isPending}
        onReprocessar={reprocessarCom}
        onApagar={apagarTranscricao}
      />
    </VStack>
  )
})
