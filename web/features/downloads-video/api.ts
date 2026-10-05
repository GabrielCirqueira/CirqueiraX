import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type {
  ApagarLoteInput,
  ApagarLoteResposta,
  AtualizarMetadataInput,
  CategoriaOpcao,
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

export async function listarCategorias(): Promise<CategoriaOpcao[]> {
  const { data } = await api.get<RespostaPaginada<CategoriaOpcao>>('/api/v1/categorias', {
    params: { limite: 100 },
  })
  return data.data
}

export function obterUrlStreamMediaItem(uuid: string): string {
  const token = localStorage.getItem('token') || ''
  const baseUrl = `/api/v1/media-itens/${uuid}/stream`
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}

export async function baixarArquivoMidia(uuid: string, nomeArquivo?: string): Promise<void> {
  const response = await api.get(`/api/v1/media-itens/${uuid}/download`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
    ? nomeArquivo.endsWith('.mp4')
      ? nomeArquivo
      : `${nomeArquivo}.mp4`
    : `video_${uuid}.mp4`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
