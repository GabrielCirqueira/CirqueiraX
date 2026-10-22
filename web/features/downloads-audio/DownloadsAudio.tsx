import { AppContainer } from '@/layouts/AppContainer'
import { useSEO } from '@/shared/hooks'
import { Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { CampoLinkAudio } from './components/CampoLinkAudio'
import { ListaAudios } from './components/ListaAudios'
import { useColarLinksNaPagina } from './hooks/useColarLinksNaPagina'
import {
  useApagarAudio,
  useAudios,
  useRebaixarAudio,
  useSolicitarDownloadAudio,
} from './hooks/useDownloadsAudio'

export function Component() {
  useSEO({
    title: 'Downloads MP3',
    description: 'Converta links de vídeo em MP3 e baixe o áudio.',
    keywords: 'mp3, áudio, download, cirqueirax',
  })

  const [pagina, setPagina] = useState(1)
  const [reproduzindoUuid, setReproduzindoUuid] = useState<string | null>(null)

  const { data, isLoading } = useAudios(pagina)
  const solicitar = useSolicitarDownloadAudio()
  const rebaixar = useRebaixarAudio()
  const apagar = useApagarAudio()

  function solicitarDownloads(urls: string[]) {
    setPagina(1)
    solicitar.mutate(urls)
  }

  function alternarReproducao(uuid: string) {
    setReproduzindoUuid((atual) => (atual === uuid ? null : uuid))
  }

  useColarLinksNaPagina(solicitarDownloads)

  return (
    <AppContainer maxWidth="5xl" paddingY="8" paddingX="6">
      <VStack align="stretch" gap={6} w="full">
        <VStack align="flex-start" gap={1}>
          <Text as="h1" fontSize="2xl" fontWeight="semibold" color="fg" letterSpacing="tight">
            Downloads MP3
          </Text>
          <Text fontSize="sm" color="fg.subtle">
            Cole um link e baixe só o áudio. Depois de 7 dias o arquivo sai do servidor, mas dá para
            baixar de novo.
          </Text>
        </VStack>

        <CampoLinkAudio enviando={solicitar.isPending} onSolicitar={solicitarDownloads} />

        <ListaAudios
          pagina={data}
          carregando={isLoading}
          agora={Date.now()}
          reproduzindoUuid={reproduzindoUuid}
          rebaixandoUuid={rebaixar.isPending ? (rebaixar.variables ?? null) : null}
          apagandoUuid={apagar.isPending ? (apagar.variables ?? null) : null}
          onMudarPagina={setPagina}
          onAlternarReproducao={alternarReproducao}
          onRebaixar={rebaixar.mutate}
          onApagar={apagar.mutate}
        />
      </VStack>
    </AppContainer>
  )
}

export default Component
