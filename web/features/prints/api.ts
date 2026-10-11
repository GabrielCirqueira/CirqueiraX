import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type {
  CategoriaOpcao,
  FiltrosPrints,
  MediaItem,
} from './types'

export async function listarPrints(
  filtros: FiltrosPrints = {}
): Promise<RespostaPaginada<MediaItem>> {
  const params: Record<string, unknown> = {
    ...filtros,
    origem: filtros.origem || 'prints',
  }
  const { data } = await api.get<RespostaPaginada<MediaItem>>('/api/v1/media-itens', {
    params,
  })
  return data
}

export async function detalharPrint(uuid: string): Promise<MediaItem> {
  const { data } = await api.get<RespostaApi<MediaItem>>(`/api/v1/media-itens/${uuid}`)
  return data.data
}

export async function listarCategorias(): Promise<CategoriaOpcao[]> {
  const { data } = await api.get<RespostaPaginada<CategoriaOpcao>>('/api/v1/categorias', {
    params: { limite: 100 },
  })
  return data.data
}

export async function categorizarPrint(uuid: string, categoriaId: string): Promise<MediaItem> {
  const { data } = await api.patch<RespostaApi<MediaItem>>(
    `/api/v1/media-itens/${uuid}/classificar`,
    { categoriaId }
  )
  return data.data
}

export async function categorizarLotePrints(
  uuids: string[],
  categoriaId: string
): Promise<MediaItem[]> {
  const { data } = await api.post<RespostaApi<MediaItem[]>>(
    '/api/v1/media-itens/lote/categorizar',
    { uuids, categoriaId }
  )
  return data.data
}

export async function apagarPrint(uuid: string): Promise<void> {
  await api.delete(`/api/v1/media-itens/${uuid}`)
}

export async function apagarLotePrints(uuids: string[]): Promise<void> {
  await api.post('/api/v1/media-itens/lote/apagar', { uuids })
}

export function obterUrlStreamPrint(uuid: string): string {
  const token = localStorage.getItem('token') || ''
  const baseUrl = `/api/v1/media-itens/${uuid}/stream`
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
}

export async function baixarArquivoPrint(uuid: string, nomeArquivo?: string): Promise<void> {
  const response = await api.get(`/api/v1/media-itens/${uuid}/download`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'image/png',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const nomeFinal = nomeArquivo
    ? (nomeArquivo.endsWith('.png') || nomeArquivo.endsWith('.jpg') ? nomeArquivo : `${nomeArquivo}.png`)
    : `print_${uuid}.png`
  link.download = nomeFinal
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function copiarPrintParaClipboard(uuid: string): Promise<boolean> {
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
    console.error('Falha ao copiar imagem para clipboard:', e)
  }
  return false
}
