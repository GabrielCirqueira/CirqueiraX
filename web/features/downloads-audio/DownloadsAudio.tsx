import { useSEO } from '@/shared/hooks'
import { Box, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { CabecalhoDownloadsAudio } from './components/CabecalhoDownloadsAudio'
import { CampoLinkAudio } from './components/CampoLinkAudio'
import { GradeAudios } from './components/GradeAudios'
import { PlayerAudio } from './components/PlayerAudio'
import { useColarLinksNaPagina } from './hooks/useColarLinksNaPagina'
import {
  useApagarAudio,
  useAudios,
  useRebaixarAudio,
  useSolicitarDownloadAudio,
} from './hooks/useDownloadsAudio'
import type { Audio } from './types'
import { contarAudiosPorStatus } from './utils/audios'

export function Component() {
  useSEO({
    title: 'Downloads MP3',
    description: 'Converta links de vídeo em MP3 e baixe o áudio.',
    keywords: 'mp3, áudio, download, cirqueirax',
  })

  const [pagina, setPagina] = useState(1)
  const [audioTocando, setAudioTocando] = useState<Audio | null>(null)

  const { data, isLoading, isFetching, refetch } = useAudios(pagina)
  const solicitar = useSolicitarDownloadAudio()
  const rebaixar = useRebaixarAudio()
  const apagar = useApagarAudio()
  const contagem = contarAudiosPorStatus(data)

  function solicitarDownloads(urls: string[]) {
    setPagina(1)
    solicitar.mutate(urls)
  }

  function alternarReproducao(audio: Audio) {
    setAudioTocando((atual) => (atual?.uuid === audio.uuid ? null : audio))
  }

  function apagarAudio(uuid: string) {
    if (audioTocando?.uuid === uuid) setAudioTocando(null)
    apagar.mutate(uuid)
  }

  useColarLinksNaPagina(solicitarDownloads)

  return (
    <Box w="full" maxW="1680px" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" gap={6} w="full">
        <CabecalhoDownloadsAudio
          contagem={contagem}
          atualizando={isFetching}
          onAtualizar={() => refetch()}
        />

        <CampoLinkAudio
          enviando={solicitar.isPending}
          emProcessamento={contagem.emProcessamento}
          onSolicitar={solicitarDownloads}
        />

        <GradeAudios
          pagina={data}
          carregando={isLoading}
          agora={Date.now()}
          tocandoUuid={audioTocando?.uuid ?? null}
          rebaixandoUuid={rebaixar.isPending ? (rebaixar.variables ?? null) : null}
          apagandoUuid={apagar.isPending ? (apagar.variables ?? null) : null}
          onMudarPagina={setPagina}
          onAlternarReproducao={alternarReproducao}
          onRebaixar={rebaixar.mutate}
          onApagar={apagarAudio}
        />

        {audioTocando && (
          <PlayerAudio audio={audioTocando} onFechar={() => setAudioTocando(null)} />
        )}
      </VStack>
    </Box>
  )
}

export default Component
