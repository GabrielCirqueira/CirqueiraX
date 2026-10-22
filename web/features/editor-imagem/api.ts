import { api } from '@/config/api'
import type { MediaItem } from '@/features/downloads-video/types'
import type { RespostaApi } from '@/shared/types/api'
import type { SalvarEdicaoInput } from './types'

export async function salvarEdicaoImagem({
  arquivo,
  nomeArquivo,
  categoriaId,
  mediaItemOrigemUuid,
}: SalvarEdicaoInput): Promise<MediaItem> {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo, nomeArquivo)
  formulario.append('nomeArquivo', nomeArquivo)
  if (categoriaId) formulario.append('categoriaId', categoriaId)
  if (mediaItemOrigemUuid) formulario.append('mediaItemOrigemUuid', mediaItemOrigemUuid)

  const { data } = await api.post<RespostaApi<MediaItem>>(
    '/api/v1/media-itens/edicoes',
    formulario,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return data.data
}

export async function detalharMidiaParaEdicao(uuid: string): Promise<MediaItem> {
  const { data } = await api.get<RespostaApi<MediaItem>>(`/api/v1/media-itens/${uuid}`)
  return data.data
}

export async function baixarArquivoDaMidia(uuid: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/api/v1/media-itens/${uuid}/stream`, {
    responseType: 'blob',
  })
  return data
}
