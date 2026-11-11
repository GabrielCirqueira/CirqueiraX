import { Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { memo, useState } from 'react'
import {
  useClassificarCanal,
  useCorrigirVideo,
  useDefinirMusicaEmLote,
  useListaRevisao,
  useUnirMusicas,
} from '../hooks'
import type { CorrecaoVideoPayload, TipoRevisao, VideoRevisao } from '../types'
import { aceitaLote, totalPaginas } from '../utils'
import { BarraLoteRevisao } from './BarraLoteRevisao'
import { CartaoCanalRevisao } from './CartaoCanalRevisao'
import { CartaoDuplicataRevisao } from './CartaoDuplicataRevisao'
import { CartaoVideoRevisao } from './CartaoVideoRevisao'
import { type ModoCorrecaoVideo, PainelCorrecaoVideo } from './PainelCorrecaoVideo'

interface AlvoPainel {
  modo: ModoCorrecaoVideo
  videos: VideoRevisao[]
}

export interface ListaRevisaoProps {
  tipo: TipoRevisao
}

export const ListaRevisao = memo(function ListaRevisao({ tipo }: ListaRevisaoProps) {
  const [pagina, setPagina] = useState(1)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [painel, setPainel] = useState<AlvoPainel | null>(null)
  const { data, isLoading, isError, isPlaceholderData } = useListaRevisao(tipo, pagina)
  const corrigir = useCorrigirVideo(tipo, pagina)
  const lote = useDefinirMusicaEmLote(tipo, pagina)
  const canal = useClassificarCanal(tipo, pagina)
  const unir = useUnirMusicas(tipo, pagina)

  const paginas = totalPaginas(data)
  const videos = data?.videos ?? []
  const videosSelecionados = videos.filter((video) => selecionados.includes(video.uuid))

  function alternarSelecao(uuid: string) {
    setSelecionados((atuais) =>
      atuais.includes(uuid) ? atuais.filter((item) => item !== uuid) : [...atuais, uuid]
    )
  }

  function aplicarCorrecao(video: VideoRevisao, payload: CorrecaoVideoPayload) {
    setSelecionados((atuais) => atuais.filter((item) => item !== video.uuid))
    corrigir.mutate({ videoUuid: video.uuid, payload }, { onSuccess: () => setPainel(null) })
  }

  function confirmarPainel(payload: CorrecaoVideoPayload) {
    const video = painel?.videos[0]
    if (video) aplicarCorrecao(video, payload)
  }

  function confirmarLote(musicaUuid: string) {
    const videoUuids = painel?.videos.map((video) => video.uuid) ?? []
    lote.mutate(
      { videoUuids, musicaUuid },
      {
        onSuccess: () => {
          setPainel(null)
          setSelecionados([])
        },
      }
    )
  }

  function mudarPagina(nova: number) {
    setSelecionados([])
    setPagina(nova)
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3}>
        <Skeleton h="140px" borderRadius="8px" />
        <Skeleton h="140px" borderRadius="8px" />
        <Skeleton h="140px" borderRadius="8px" />
      </VStack>
    )
  }

  if (isError || !data) {
    return (
      <Text fontSize="sm" color="cirqueira.musica.textoSecundario" py={8} textAlign="center">
        Não foi possível carregar a revisão. Tente de novo em instantes.
      </Text>
    )
  }

  const vazio = videos.length === 0 && data.canais.length === 0 && data.duplicatas.length === 0

  return (
    <VStack align="stretch" gap={3} opacity={isPlaceholderData ? 0.7 : 1}>
      {aceitaLote(tipo) && selecionados.length > 0 && (
        <BarraLoteRevisao
          quantidade={videosSelecionados.length}
          onDefinirMusica={() => setPainel({ modo: 'escolher', videos: videosSelecionados })}
          onLimpar={() => setSelecionados([])}
        />
      )}

      {vazio && (
        <VStack py={12} gap={2} color="cirqueira.musica.textoSecundario">
          <CheckCircle2 size={28} color="var(--chakra-colors-cirqueira-musica-verde)" />
          <Text fontSize="sm">Nada para revisar aqui.</Text>
        </VStack>
      )}

      {videos.map((video) => (
        <CartaoVideoRevisao
          key={video.uuid}
          video={video}
          tipo={tipo}
          selecionado={selecionados.includes(video.uuid)}
          ocupado={corrigir.isPending && corrigir.variables?.videoUuid === video.uuid}
          onAlternarSelecao={alternarSelecao}
          onCorrigir={aplicarCorrecao}
          onEscolherMusica={(alvo) => setPainel({ modo: 'escolher', videos: [alvo] })}
          onMarcarMashup={(alvo) => setPainel({ modo: 'mashup', videos: [alvo] })}
          onClassificarCanal={(nome, classificacao) => canal.mutate({ canal: nome, classificacao })}
        />
      ))}

      {data.canais.map((item) => (
        <CartaoCanalRevisao
          key={item.canal}
          canal={item}
          ocupado={canal.isPending && canal.variables?.canal === item.canal}
          onClassificar={(nome, classificacao) => canal.mutate({ canal: nome, classificacao })}
        />
      ))}

      {data.duplicatas.map((duplicata) => (
        <CartaoDuplicataRevisao
          key={duplicata.musicas.map((musica) => musica.uuid).join('-')}
          duplicata={duplicata}
          ocupado={unir.isPending}
          onUnir={(origemUuid, destinoUuid) => unir.mutate({ origemUuid, destinoUuid })}
        />
      ))}

      {paginas > 1 && (
        <HStack justify="center" gap={3} pt={2}>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => mudarPagina(pagina - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            Página {pagina} de {paginas}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Próxima página"
            disabled={pagina >= paginas}
            onClick={() => mudarPagina(pagina + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </HStack>
      )}

      {painel && (
        <PainelCorrecaoVideo
          key={`${painel.modo}-${painel.videos.map((video) => video.uuid).join('-')}`}
          modo={painel.modo}
          videos={painel.videos}
          salvando={corrigir.isPending || lote.isPending}
          onFechar={() => setPainel(null)}
          onConfirmar={confirmarPainel}
          onConfirmarLote={confirmarLote}
        />
      )}
    </VStack>
  )
})
