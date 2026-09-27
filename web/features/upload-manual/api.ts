import { api } from '@/config/api'
import type { MediaItem } from '@/features/downloads-video/types'
import type { RespostaApi } from '@/shared/types/api'
import type { EnviarArquivoParams, ResultadoUploadMediaItem } from './types'

export async function enviarArquivoUpload({
  arquivo,
  categoriaId,
  onProgress,
}: EnviarArquivoParams): Promise<ResultadoUploadMediaItem> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  if (categoriaId) {
    formData.append('categoriaId', categoriaId)
  }

  const { data } = await api.post<RespostaApi<MediaItem & { _warning?: string }>>(
    '/api/v1/media-itens/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentual = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentual)
        }
      },
    }
  )

  const ehDuplicado = data.data._warning === 'item_duplicado_existente'

  return {
    mediaItem: data.data,
    ehDuplicado,
  }
}
