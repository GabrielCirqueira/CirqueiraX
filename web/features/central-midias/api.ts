import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type { CategoriaOpcao, ContagensMidias, FiltrosCentralMidias, MediaItem } from './types'

export async function obterContagensMidias(): Promise<ContagensMidias> {
  const { data } = await api.get<RespostaApi<ContagensMidias>>('/api/v1/media-itens/contagens')
  return data.data
}

export async function listarMidiasCentral(
  filtros: FiltrosCentralMidias = {}
): Promise<RespostaPaginada<MediaItem>> {
  const params: Record<string, unknown> = {
    pagina: filtros.pagina || 1,
    porPagina: filtros.porPagina || 24,
    ordenacao: filtros.ordenacao || 'criadoEm',
    direcao: filtros.direcao || 'DESC',
  }

  if (filtros.busca?.trim()) {
    params.busca = filtros.busca.trim()
  }

  if (filtros.status && filtros.status !== 'todos') {
    params.status = filtros.status
  }

  if (filtros.origem && filtros.origem !== 'todas') {
    params.origem = filtros.origem
  }

  if (filtros.tipo && filtros.tipo !== 'todos') {
    params.tipo = filtros.tipo
  }

  if (filtros.categoriaId) {
    params.categoriaId = filtros.categoriaId
  }

  const { data } = await api.get<RespostaPaginada<MediaItem>>('/api/v1/media-itens', {
    params,
  })
  return data
}

export async function detalharMidia(uuid: string): Promise<MediaItem> {
  const { data } = await api.get<RespostaApi<MediaItem>>(`/api/v1/media-itens/${uuid}`)
  return data.data
}

export async function listarCategorias(): Promise<CategoriaOpcao[]> {
  const { data } = await api.get<RespostaPaginada<CategoriaOpcao>>('/api/v1/categorias', {
    params: { limite: 100 },
  })
  return data.data
}

export async function categorizarMidia(uuid: string, categoriaId: string): Promise<MediaItem> {
  const { data } = await api.patch<RespostaApi<MediaItem>>(
    `/api/v1/media-itens/${uuid}/classificar`,
    { categoriaId }
  )
  return data.data
}

export async function categorizarLoteMidias(
  uuids: string[],
  categoriaId: string
): Promise<MediaItem[]> {
  const { data } = await api.post<RespostaApi<MediaItem[]>>(
    '/api/v1/media-itens/lote/categorizar',
    { uuids, categoriaId }
  )
  return data.data
}

export async function apagarMidia(uuid: string): Promise<void> {
  await api.delete(`/api/v1/media-itens/${uuid}`)
}

export async function apagarLoteMidias(uuids: string[]): Promise<void> {
  await api.post('/api/v1/media-itens/lote/apagar', { uuids })
}

export function obterUrlStreamMidia(uuid: string): string {
  const token = localStorage.getItem('token') || ''
  const baseUrl = `/api/v1/media-itens/${uuid}/stream`
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}

export function obterUrlThumbnailMidia(uuid: string): string {
  const token = localStorage.getItem('token') || ''
  const baseUrl = `/api/v1/media-itens/${uuid}/thumbnail`
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}

export async function baixarArquivoMidia(
  uuid: string,
  nomeArquivo?: string,
  isVideo = false
): Promise<void> {
  const response = await api.get(`/api/v1/media-itens/${uuid}/download`, {
    responseType: 'blob',
  })
  const fallbackMime = isVideo ? 'video/mp4' : 'image/png'
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || fallbackMime,
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const extensaoPadrao = isVideo ? '.mp4' : '.png'
  const nomeFinal = nomeArquivo
    ? nomeArquivo.includes('.')
      ? nomeArquivo
      : `${nomeArquivo}${extensaoPadrao}`
    : `midia_${uuid}${extensaoPadrao}`
  link.download = nomeFinal
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function copiarImagemParaClipboard(uuid: string): Promise<boolean> {
  try {
    const response = await api.get(`/api/v1/media-itens/${uuid}/stream`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'image/png' })
    if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          'image/png': blob,
        }),
      ])
      return true
    }
  } catch (e) {
    console.error('Falha ao copiar mídia para área de transferência:', e)
  }
  return false
}
