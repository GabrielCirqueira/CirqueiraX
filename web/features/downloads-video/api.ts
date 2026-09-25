import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type {
  ApagarLoteInput,
  ApagarLoteResposta,
  AtualizarMetadataInput,
  CategorizarLoteInput,
  FiltrosMediaItem,
  MediaItem,
  PedidoDownloadInput,
  PedidoDownloadResposta,
  RebaixarLoteInput,
} from './types'

export async function listarMediaItens(
  filtros: FiltrosMediaItem = {}
): Promise<RespostaPaginada<MediaItem>> {
  const { data } = await api.get<RespostaPaginada<MediaItem>>('/api/v1/media-itens', {
    params: filtros,
  })
  return data
}

export async function detalharMediaItem(uuid: string): Promise<MediaItem> {
  const { data } = await api.get<RespostaApi<MediaItem>>(`/api/v1/media-itens/${uuid}`)
  return data.data
}

export async function criarPedidoDownload(
  input: PedidoDownloadInput
): Promise<PedidoDownloadResposta> {
  const { data } = await api.post<RespostaApi<PedidoDownloadResposta>>('/api/v1/downloads', input)
  return data.data
}

export async function categorizarLote(input: CategorizarLoteInput): Promise<MediaItem[]> {
  const { data } = await api.post<RespostaApi<MediaItem[]>>(
    '/api/v1/media-itens/lote/categorizar',
    input
  )
  return data.data
}

export async function rebaixarLote(input: RebaixarLoteInput): Promise<MediaItem[]> {
  const { data } = await api.post<RespostaApi<MediaItem[]>>(
    '/api/v1/media-itens/lote/rebaixar',
    input
  )
  return data.data
}

export async function apagarLote(input: ApagarLoteInput): Promise<ApagarLoteResposta> {
  const { data } = await api.post<RespostaApi<ApagarLoteResposta>>(
    '/api/v1/media-itens/lote/apagar',
    input
  )
  return data.data
}

export async function atualizarMetadata(
  uuid: string,
  input: AtualizarMetadataInput
): Promise<MediaItem> {
  const { data } = await api.patch<RespostaApi<MediaItem>>(`/api/v1/media-itens/${uuid}`, input)
  return data.data
}

export async function classificarCategoriaIndividual(
  uuid: string,
  categoriaId: string
): Promise<MediaItem> {
  const { data } = await api.patch<RespostaApi<MediaItem>>(
    `/api/v1/media-itens/${uuid}/categoria`,
    {
      categoriaId,
    }
  )
  return data.data
}

export async function retentarMediaItem(uuid: string): Promise<MediaItem> {
  const { data } = await api.post<RespostaApi<MediaItem>>(`/api/v1/media-itens/${uuid}/retentar`)
  return data.data
}

export async function retentarTodos(): Promise<MediaItem[]> {
  const { data } = await api.post<RespostaApi<MediaItem[]>>('/api/v1/media-itens/retentar')
  return data.data
}

export async function listarCategorias(): Promise<Array<{ uuid: string; nome: string }>> {
  const { data } = await api.get<RespostaPaginada<{ uuid: string; nome: string }>>(
    '/api/v1/categorias',
    {
      params: { limite: 100 },
    }
  )
  return data.data
}
